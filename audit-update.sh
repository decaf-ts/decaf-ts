#!/bin/bash

# Dependency Audit and Update Script for decaf-ts Monorepo
# Processes modules in order from .gitmodules

MODULES=(
    "utils"
    "logging"
    "decoration"
    "decorator-validation"
    "injectable-decorators"
    "as-zod"
    "db-decorators"
    "transactional-decorators"
    "core"
    "for-http"
    "ui-decorators"
    "cli"
    "for-couchdb"
    "for-nano"
    "for-pouch"
    "for-typeorm"
    "for-fabric"
    "for-nest"
    "styles"
    "for-angular"
    "for-react-native"
    "demo"
    "web-page"
)

# Special handling modules
FABRIC_ONLY_UNIT_TESTS=("for-fabric")
ANGULAR_REACT_MODULES=("for-angular" "demo" "web-page" "for-react-native")

REPORT_FILE="/tmp/audit-report.md"
echo "# Dependency Audit and Update Report" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"

process_module() {
    local module_path=$1
    local module_name=$(basename "$module_path")
    
    echo "Processing: $module_name"
    echo "## Module: $module_name" >> "$REPORT_FILE"
    echo "---" >> "$REPORT_FILE"
    
    cd "$module_path"
    
    # Store original package.json
    cp package.json package.json.bak
    
    # Update @types/jest to latest (or add if missing)
    local jest_version=$(npm view @types/jest version 2>/dev/null || echo "30.2.2")
    echo "Latest @types/jest: $jest_version"
    
    local has_jest=$(cat package.json | grep -c "@types/jest" || echo "0")
    if [ "$has_jest" -eq "0" ]; then
        echo "Adding @types/jest to devDependencies"
        NODE_VERSION=$(cat package.json | jq -r '.version')
        jq --arg ver "$jest_version" '.devDependencies["@types/jest"] = $ver' package.json > package.json.tmp && mv package.json.tmp package.json
    else
        echo "Updating @types/jest to $jest_version"
        jq --arg ver "$jest_version" '.devDependencies["@types/jest"] = $ver' package.json > package.json.tmp && mv package.json.tmp package.json
    fi
    
    # Add overrides for known vulnerabilities
    # Common overrides for audit issues
    local overrides_added="false"
    
    # Add common security overrides
    local has_overrides=$(cat package.json | jq -r '.overrides // empty' | wc -l)
    if [ "$has_overrides" -eq "0" ]; then
        jq '.overrides = {
    "minimatch": "^10.2.2",
    "test-exclude": "7.0.1"
}' package.json > package.json.tmp && mv package.json.tmp package.json
        overrides_added="true"
    else
        # Check if minimatch is already in overrides
        local has_minimatch=$(cat package.json | jq -r '.overrides.minimatch // empty' | wc -l)
        if [ "$has_minimatch" -eq "0" ]; then
            jq '.overrides.minimatch = "^10.2.2" | .overrides["test-exclude"] = "7.0.1"' package.json > package.json.tmp && mv package.json.tmp package.json
            overrides_added="true"
        fi
    fi
    
    if [ "$overrides_added" = "true" ]; then
        echo "Added/updated overrides in package.json"
        echo "### Changes to package.json" >> "$REPORT_FILE"
        echo "Added/updated overrides for security vulnerabilities" >> "$REPORT_FILE"
        echo '```json' >> "$REPORT_FILE"
        cat package.json | jq -r '.overrides' >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
    fi
    
    # Show package.json diff
    echo "### Before/After package.json" >> "$REPORT_FILE"
    echo '```bash' >> "$REPORT_FILE"
    diff -u package.json.bak package.json || true
    echo '```' >> "$REPORT_FILE"
    
    # Run npm install
    echo "Running npm install..."
    npm install 2>&1 | tee /tmp/npm_install_${module_name}.log
    
    # Run npm audit
    echo "Running npm audit..."
    npm audit 2>&1 | tee /tmp/npm_audit_${module_name}.log
    
    local audit_output=$(cat /tmp/npm_audit_${module_name}.log)
    if echo "$audit_output" | grep -q "No vulnerabilities"; then
        echo "### Audit Status: ✅ No vulnerabilities found" >> "$REPORT_FILE"
    else
        local vulnerabilities=$(echo "$audit_output" | grep -c "vulnerability" || echo "0")
        echo "### Audit Status: ⚠️ Found $vulnerabilities vulnerabilities" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        echo "$audit_output" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
    fi
    
    # Run npm audit --fix
    echo "Running npm audit --fix..."
    npm audit --fix 2>&1 | tee /tmp/npm_audit_fix_${module_name}.log
    
    # Run build (if available)
    if grep -q '"build"' package.json; then
        echo "Running build..."
        npm run build 2>&1 | tee /tmp/npm_build_${module_name}.log
        
        if [ $? -eq 0 ]; then
            echo "### Build Status: ✅ Passed" >> "$REPORT_FILE"
        else
            echo "### Build Status: ❌ Failed" >> "$REPORT_FILE"
            echo "Build logs:" >> "$REPORT_FILE"
            echo '```' >> "$REPORT_FILE"
            tail -50 /tmp/npm_build_${module_name}.log >> "$REPORT_FILE"
            echo '```' >> "$REPORT_FILE"
        fi
    else
        echo "No build script found"
    fi
    
    # Determine test command based on module type
    local test_cmd="npm run test:all"
    if [[ " ${FABRIC_ONLY_UNIT_TESTS[@]} " =~ " ${module_name} " ]]; then
        test_cmd="npm run test:unit"
    fi
    
    if [[ " ${ANGULAR_REACT_MODULES[@]} " =~ " ${module_name} " ]]; then
        test_cmd="npm run test:all"
    fi
    
    # Run tests (if available)
    if grep -q '"test"' package.json; then
        echo "Running tests..."
        $test_cmd 2>&1 | tee /tmp/npm_test_${module_name}.log
        
        if [ ${PIPESTATUS[0]} -eq 0 ]; then
            echo "### Test Status: ✅ Passed" >> "$REPORT_FILE"
        else
            echo "### Test Status: ❌ Failed" >> "$REPORT_FILE"
            echo "Test logs:" >> "$REPORT_FILE"
            echo '```' >> "$REPORT_FILE"
            tail -50 /tmp/npm_test_${module_name}.log >> "$REPORT_FILE"
            echo '```' >> "$REPORT_FILE"
        fi
    else
        echo "No test script found"
    fi
    
    cd ..
    
    echo ""
    echo ""
}

# Process utils first (as mentioned it's already updated)
echo "Utils is already updated, skipping..."
echo "" >> "$REPORT_FILE"
echo "## Module: utils" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "### Status: Already processed in previous run" >> "$REPORT_FILE"
echo "Skipped processing" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Process remaining modules
for module in "${MODULES[@]}"; do
    if [ "$module" = "utils" ]; then
        continue
    fi
    process_module "$module"
    echo "" >> "$REPORT_FILE"
done

echo "Report saved to $REPORT_FILE"
cat "$REPORT_FILE"
