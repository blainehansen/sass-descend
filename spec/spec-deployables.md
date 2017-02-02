## Deployables

Deployables allow you to define a component with state properties, which you can then reference from the content of the component. Then you can define different versions and transformations of the component, with different values of those state properties, and the changes you make will cascade to all the references.

Here's a basic example.

```sass
.deployable-component
	@include dy-deployable() // activates this selector as a deployable. only valid on a single simple selector
	@include dy-define-state(color, red) // saves the default state

	@include dy-apply(color) // here's a reference to the state

	&.open
		@include dy-define-state(color, blue) // changes a state property when the deployable is this version

	@include dy-build() // closes the deployable definition and builds it
```

This will output something equivalent to this:

```sass
.deployable-component
	color: red

	&.open
		color: blue
```

See how the Deployable remembered the reference (`@include dy-apply(color)`), and output an adjusted version of it for `.open`?

This gets much more powerful when you have more references and versions.

```sass
.deployable-component
	@include dy-deployable()
	@include dy-define-state(color, red)

	@include dy-apply(color)

	.nested-block
		@include dy-look-transform(color, background-color, adjust-hue, 180)
		@include dy-apply(color)

	&.open
		@include dy-define-state(color, blue)

	&:first-child
		@include dy-define-state(color, green)

	@include dy-build()
```
Compiles to something like:

```sass
.deployable-component
	color: red

	.nested-block
		background-color: adjust-hue(red, 180)
		color: red

	&.open
		color: blue

		.nested-block
			background-color: adjust-hue(blue, 180)
			color: blue

	&:first-child
		color: green

		.nested-block
			background-color: adjust-hue(green, 180)
			color: green
```

When different versions conflict with each other, the one defined most recently wins. So in the above example, if the element was both `.open` and `:first-child`, it would be green since `:first-child` was defined last.

You can create more specific versions to handle these kinds of situations.

```sass
.deployable-component
	@include dy-deployable()
	@include dy-define-state(color, red)

	@include dy-apply(color)

	.nested-block
		@include dy-look-transform(color, background-color, adjust-hue, 180)
		@include dy-apply(color)


	&.open:first-child
		// this will work even though it's defined before the others, because it's more specific
		@include dy-define-state(color, silver)

	&.open
		@include dy-define-state(color, blue)

	&:first-child
		@include dy-define-state(color, green)

	@include dy-build()
```


All of the Bubble functions have corollaries in Deployables. They all work the same, except that the Deployable versions can only be called in a Deployable and are remembered by it, and that the Deployable versions must be given a css attribute to output to.

- `dy-apply($property-name, $css-name: null)`: outputs the property to the given css attribute, using the property name if none is supplied.
- `dy-transform($property-name, $css-name: null, $function, $args...)`: transforms the property, saves it, and outputs the result to the given css attribute, using the property name if none is supplied.
- `dy-look-transform($property-name, $css-name: null, $function, $args...)`: transforms the property, *doesn't* save it, and outputs the result to the given css attribute, using the property name if none is supplied.
- `dy-operate($property-name, $css-name: null, $function, $args...)`: operates on the properties specified by args as `'self.property-name'`, saves the result to the property name you supply, and outputs the result to the given css attribute, using the property name if none is supplied.
- `dy-look-operate($css-name, $function, $args...)`: operates on the properties specified by args as `'self.property-name'`, *doesn't* save the result, and outputs the result to the given css attribute.


A valid version is any selector that contains the `&`, and which therefore refers to the deployable in some different situation. Here are some examples of valid places to make version changes.

- Compounding selectors: `&#id`, `&.big`
- With an element: `span&`, `a&`
- Pseudo-elements: `&::before`
- Different contexts: `.container &`, `#trigger + &`
- With attributes or psueudo-classes: `&:active`, `&[target=_blank]`

Anything that's nested (like `.nested-block` above) isn't a valid version. It's instead referred to as the *content*, and it's the stuff that gets repeated for each version. Trying to override a state property from within the content isn't allowed.

```sass
.deployable-component
	@include dy-deployable()
	@include dy-define-state(color, red)

	@include dy-define-state(color, blue) // -> ERROR, can't overwrite an existing state variable in the same version.

	.nested-block
		@include dy-define-state(color, green) // -> ERROR, invalid location to set deployable state, content
		@include dy-apply(color)

	@include dy-build()
```


Also, suffixing doesn't work at this point.

```sass
.deployable-component
	@include dy-deployable()
	@include dy-define-state(color, red)

	&-suffix // compiles to .deployable-component-suffix
		@include dy-define-state(color, blue) // -> ERROR, invalid location to set deployable state, this isn't a deployable component
```

<!-- blaine, explore the idea of a deployable interface, or basically a prepackaged set of transforms or states you can just layer on top of a deployable -->



### Transforms

You can define transforms on the component. These work very similarly to Versions, but instead of setting the state directly, you define a change to be made to it.

```sass
.deployable-component
	@include dy-deployable()
	@include dy-define-state(color, red)

	@include dy-apply(color)

	&:hover
		@include dy-define-transform(color, fade-out, 0.2)

	@include dy-build()
```

```sass
.deployable-component
	color: red

	&:hover
		color: fade-out(color, 0.2)
```

By default, every combination of all transforms are applied to every Version, and their changes are applied one after the other in the order they were defined.

First a simple example.

```sass
.deployable-component
	@include dy-deployable()
	@include dy-define-state(color, red)

	@include dy-apply(color)

	// our transform
	&:hover
		@include dy-define-transform(color, fade-out, 0.2)

	// our versions
	&.green
		@include dy-define-state(color, green)

	&.blue
		@include dy-define-state(color, blue)

	@include dy-build()
```
```sass
.deployable-component
	color: red

	&:hover
		color: fade-out(red, 0.2)

	&.green
		color: green

		&:hover
			color: fade-out(green, 0.2)

	&.blue
		color: blue

		&:hover
			color: fade-out(blue, 0.2)
```

And now a more complex one.

```sass
.deployable-component
	@include dy-deployable()
	@include dy-define-state(color, red)
	@include dy-define-state(margin, 10px)

	@include dy-apply(color)
	@include dy-apply(margin)

	// our transforms
	&.open
		@include dy-define-transform(color, adjust-hue, 180)

	&:hover
		@include dy-define-transform(color, fade-out, 0.2)
		@include dy-define-transform(margin, 5px)

	// our versions
	&.green
		@include dy-define-state(color, green)
		@include dy-define-state(margin, 20px)

	&.blue
		@include dy-define-state(color, blue)

	@include dy-build()
```
```sass
.deployable-component
	// first the default version and it's transformations
	color: red
	margin: 10px

	&.open
		color: adjust-hue(red, 180)
			&:hover
				// since the .open transform was defined first, it happens first
				color: fade-out(adjust-hue(red, 180), 0.2)

	&:hover
		color: fade-out(red, 0.2)
		// Deployables are smart enough not to output redundant values, so this redefinition doesn't appear in every combination
		margin: 15px

	// then this versions's
	&.green
		color: green
		margin: 20px

		&.open
			color: adjust-hue(green, 180)
				&:hover
					color: fade-out(adjust-hue(green, 180), 0.2)

		&:hover
			color: fade-out(green, 0.2)
			margin: 25px

	// and this one's
	&.blue
		color: blue

		&.open
			color: adjust-hue(blue, 180)
				&:hover
					color: fade-out(adjust-hue(blue, 180), 0.2)

		&:hover
			color: fade-out(blue, 0.2)
```

Obviously, this can get really big really fast, and as you add more and more references in the content, and versions, and transforms, things can get hard to keep track of. The best solution is to just keep your Deployables simple, but if you need more control, there's the `$compound` option.

When you call `dy-deployable`, you can control which transforms you want to be combined. This can help you keep things simple.

To turn off all compounding, pass `false`. This means every version only gets the simplest version of each transform. 

```sass
.deployable-component
	@include dy-deployable($compound: false)
	@include dy-define-state(color, red)

	@include dy-apply(color)

	// our transforms
	&.open
		@include dy-define-transform(color, adjust-hue, 180)

	&:hover
		@include dy-define-transform(color, fade-out, 0.2)

	// our versions
	&.green
		@include dy-define-state(color, green)

	@include dy-build()
```
```sass
.deployable-component
	// first the default version and it's transformations
	color: red

	&.open
		color: adjust-hue(red, 180)

	&:hover
		color: fade-out(red, 0.2)

	// then this versions's
	&.green
		color: green

		&.open
			color: adjust-hue(green, 180)

		&:hover
			color: fade-out(green, 0.2)
```

You can also pass a single selector or a list, and these are the ones that are allowed to be compounded onto others.

```sass
.deployable-component
	@include dy-deployable($compound: ':hover')
	@include dy-define-state(color, red)

	@include dy-apply(color)

	// our transforms
	&.open
		@include dy-define-transform(color, adjust-hue, 180)

	&:active
		@include dy-define-transform(color, desaturate, 30)

	&:hover
		@include dy-define-transform(color, fade-out, 0.2)

	@include dy-build()
```
```sass
.deployable-component
	color: red

	&.open
		color: adjust-hue(red, 180)

		// notice how only :hover has been compounded onto the others?
		&:hover
			color: fade-out(adjust-hue(red, 180), 0.2)

	&:active
		color: desaturate(red, 30)

		&:hover
			color: fade-out(desaturate(red, 30), 0.2)

	&:hover
		color: fade-out(red, 0.2)
```

You can override transforms with more specific versions.

```sass
.deployable-component
	@include dy-deployable()
	@include dy-define-state(color, red)

	@include dy-apply(color)

	// our transforms
	&.open
		@include dy-define-transform(color, adjust-hue, 180)

	&:hover
		@include dy-define-transform(color, fade-out, 0.2)

	&.open:hover
		@include dy-define-transform(color, darken, 30)

	@include dy-build()
```
```sass
.deployable-component
	color: red

	&.open
		color: adjust-hue(red, 180)

		// notice how the compound of .open and :hover doesn't happen here?
		// it's been overridden

	&:hover
		color: fade-out(red, 0.2)

	// this ignores the other two
	&.open:hover
		color: darken(red, 30)
```

This overriding happens no matter what you've passed to `$compound`. Manual overrides take precedence, so you can use this in conjunction with `$compound` to cover all the situations you care about with the greatest convenience.


Transforms follow the same rules as Versions. If the selector you're placing them in contains an `&`, you're good. Any block that could be a Version could also be a Transform, depending on what you call inside of them.

However, trying to override a version with a transform or vice-versa will throw an error.

```sass
.deployable-component
	@include dy-deployable()
	@include dy-define-state(color, red)

	@include dy-apply(color)

	// our transforms
	&.open
		@include dy-define-state(color, green)

	&:hover
		@include dy-define-transform(color, fade-out, 0.2)

	&.open:hover
		@include dy-define-transform(color, darken, 30) // -> ERROR: versions and transforms can't be intermingled

	@include dy-build()
```


And trying to define a transform and do any other type of state change in the same block will throw an error.

```sass
.deployable-component
	@include dy-deployable()
	@include dy-define-state(color, red)

	@include dy-apply(color)

	&:hover
		@include dy-define-state(color, green)
		@include dy-define-transform(color, fade-out, 0.2) // -> ERROR: versions and transforms can't be intermingled

	@include dy-build()
```


### Content Overrides

In different Versions of a Deployable, you can override the content declarations.

```sass
.deployable-component
	@include dy-deployable()
	@include dy-define-state(color, red)

	@include dy-apply(color)

	.nested-block
		@include dy-look-transform(color, background-color, adjust-hue, 180) // -> the direct complement
		@include dy-apply(color)

		&.open
			@include dy-look-transform(color, null, darken, 30)

	&.open
		@include dy-define-state(color, blue)

	@include dy-build()
```
Compiles to something like:

```sass
.deployable-component
	color: red

	.nested-block
		background-color: adjust-hue(red, 180)
		color: red

	&.open
		color: blue

		.nested-block
			background-color: adjust-hue(blue, 180)
			color: darken(blue, 30)
```


### Inheritance and Instantiation

You can create secondary Deployables that extend the states, versions, and transforms of existing Deployables.

```sass
.deployable-component
	@include dy-deployable()
	@include dy-define-state(color, red)

	@include dy-apply(color)

	&:hover
		@include dy-define-transform(color, fade-out, 0.2)

	@include dy-build()

.inheriting-component
	@include dy-deployable('.deployable-component')
	@include dy-define-state(color, orange)

	@include dy-look-transform(color, background-color, adjust-hue, 180)

	@include dy-build()
```
Compiles to something like:

```sass
.deployable-component
	color: red

	&:hover
		color: fade-out(red, 0.2)

.inheriting-component
	color: orange
	background-color: adjust-hue(orange, 180)

	&:hover
		color: fade-out(orange, 0.2)
		background-color: adjust-hue(fade-out(orange, 0.2), 180)
```

`@extend` is called for you under the hood, so any normal non-state css attributes you set will also be extended.


You can also create different versions in different blocks away from the Deployable definition. Everything you can do in the definition you can do here.

```sass
.deployable-component
	@include dy-deployable()
	@include dy-define-state(color, red)

	@include dy-apply(color)

	&:hover
		@include dy-define-transform(color, fade-out, 0.2)

	@include dy-build()

.container
	// this is an instantiation
	.deployable-component
		@include dy-define-state(color, yellow)

		@include dy-transform(color, background-color, adjust-hue, 180)

		@include dy-build()
```
```sass

// ... .deployable-component output ...

.container .deployable-component
	color: yellow
	background-color: adjust-hue(color, 180)

	&:hover
		color: fade-out(yellow, 0.2)
		background-color: adjust-hue(fade-out(yellow, 0.2), 180)
```

Defining an instantiation with transformation selectors already applied will narrow the output.

```sass
.deployable-component
	@include dy-deployable()
	@include dy-define-state(color, red)

	@include dy-apply(color)

	&.open
		@include dy-define-transform(color, adjust-hue, 180)

	&:hover
		@include dy-define-transform(color, fade-out, 0.2)

	@include dy-build()

.container
	// this is an instantiation
	.deployable-component.open
		@include dy-define-state(color, yellow)

		@include dy-build()
```
```sass

// ... .deployable-component output ...

.container .deployable-component.open
	color: adjust-hue(yellow, 180)

	&:hover
		color: fade-out(adjust-hue(yellow, 180), 0.2)
```



### Require and Extend-Only Deployables

The `dy-require` method can be used to optionally pull a normal Bubble property from the containing context. If you use an extend-only placeholder (a selector like `%deployable`) then you don't have to provide a default value. Otherwise you do.

```sass
// none of this will end up actually being output as css until you use it somewhere
%deployable
	@include dy-deployable()

	// will pull 'color' from parent and save to 'color'
	// will throw an error if you try to deploy one of these with a null value
	@include dy-require(color)

	// or...
	// if it isn't found, red will be the value
	@include dy-require(color, $default: red)

	// or...
	// will pull 'parent-color' from parent and save to 'color', defaulting to red
	@include dy-require(color, $default: red, $pull: parent-color)

	&:hover
		@include dy-define-transform(color, fade-out, 0.2)

	@include dy-build()


.container
	@include bu-property(color, purple)
	.extending-component
		// extend-only placeholders are the only type you can declare inside other things
		@include dy-deployable('%deployable')

		// ... optionally perform overrides or whatever ...

		@include dy-build()


.different-container
	.other-extending-component
		@include dy-deployable('%deployable') // -> ERROR: a dy-require call returned null without a default.


.deployable-component
	@include dy-deployable()

	@include dy-require(color) // -> ERROR: only extend-only deployables can not include a default.

	// ...
```
