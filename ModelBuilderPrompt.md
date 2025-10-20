under the file ./src/model/Builder.ts are two classes: Model Builder ad AttributeBuilder. Both implement a builder design pattern and must keep it.
the purpose of the ModelBuilder class is to at runtime, dynamically construct a unique class where for each attribute added to the class, use the Attribute builder to build the
validation for that attribute.
The attribute class build be build dynamically to accomodate all validation decorators avaliable (they can be found, in the code, at runtime by calling Validation.decorators().
to get the actual decorator to apply to the class at runtime use Validation.decoratorFronKey(key));
the resurting class must be unique (including its name);
when, at runtime i call the constructor i received from ModelBuilder...build() it must be typed to all the properties and theis selected types and must be a subclass  of Model;
create tests under ./tests/unit. do not stop until the feature is working as intended and completely tested. the target test coverage is 95%
