# VSCode Configuration

This directory contains VSCode configuration files that were automatically generated from JetBrains run configurations.

## Files

- `tasks.json`: Contains task definitions that can be run from the VSCode Command Palette using "Tasks: Run Task"
- `launch.json`: Contains debug configurations that can be used from the VSCode Debug view

## How to Use

### Running Tasks

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) to open the Command Palette
2. Type "Tasks: Run Task" and select it
3. Choose one of the available tasks from the list

### Debugging

1. Open the Debug view by clicking on the Debug icon in the Activity Bar on the side of VS Code or by pressing `Ctrl+Shift+D` (or `Cmd+Shift+D` on macOS)
2. Select a debug configuration from the dropdown at the top of the Debug view
3. Start debugging by pressing the green play button or by pressing `F5`

## Updating Configurations

If the JetBrains run configurations are updated, you can regenerate the VSCode configurations by running:

```bash
node convert_run_configs.js
```

This script will:
1. Read all XML files in the `.idea/runConfigurations` directory
2. Convert them to VSCode tasks and debug configurations
3. Update the `tasks.json` and `launch.json` files in this directory

## Configuration Types

The script handles the following types of JetBrains run configurations:

- npm script configurations (`js.build_tools.npm`)
- Jest test configurations (`JavaScriptTestRunnerJest`)
- JavaScript debug configurations (`JavascriptDebugType`)
- Other types are converted to generic shell tasks

## Troubleshooting

If you encounter any issues with the tasks or debug configurations:

1. Check that the paths in the configurations are correct for your environment
2. Ensure that all required dependencies are installed
3. Try regenerating the configurations using the script
4. If problems persist, you may need to manually edit the configuration files