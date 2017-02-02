### This project is in active development.

**It is not ready for use, but Pull Requests are welcome!**
  
Go ahead and contact me if you'd like to help with any of the following tasks, or if you have input or thoughts about the library.

Roadmap:

- Implement Bubble Complex Selector mixins.
- Implement Deployables.
- Unit tests (probably using [true](https://www.npmjs.com/package/sass-true)).
- Make useable as node package on npm.
- Create Gulp plugin.
- Create Grunt plugin.
- Make useable as Meteor package.
	- Either finalize [fourseven:scss pull request](https://github.com/fourseven/meteor-scss/pull/238) to allow custom javascript functions, or create and maintain a fork of that project allowing it.
- Make useable by ruby sass.
	- Write ruby versions of custom functions.


# Descend, property lookup for sass

This library has two different systems for dealing with properties. One is simple and just looks up the nesting tree, it's called Bubble. The other deals with components that have transformable state, called Deployables.


## Bubble, basic properties

The simpler of the two systems is Bubble. This simply looks naively up the tree looking for the property, and it has some important restrictions.

The basic use is simple. Just store a property on your selector, and it's available at that level and any deeper level.

```sass
.container
	@include bu-property(color, red)
	color: bu-property(color) // -> red

	&:hover
		color: bu-property(color) // -> red
```

You can override properties.

```sass
.container
	@include bu-property(color, red)

	.other
		@include bu-property(color, green)
		color: bu-property(color) // -> green

		&.open
			color: bu-property(color) // -> green
```

It looks for the property naively, so it won't consider things of similar names.

```sass
.container
	@include bu-property(color, red)

	.nested
		@include bu-property(color, green)

	&:hover
		color: bu-property(color) // -> red

		.nested
			color: bu-property(color) // -> still red, even though theoretically it would make sense to be green
```

You can save a property and output it as css at the same time.

```sass
.component
	color: bu-property(color, red)
```
```css
.component {
	color: red;
}
```

If you define a property on something, and then open up that same selector again later, the property will still be available.

```sass
.container
	@include bu-property(color, red)

	.nested
		@include bu-property(color, green)

.container
	@debug bu-property(color) // -> red

	.nested
		@debug bu-property(color) // -> green

.container ~ .previous-block
	@debug bu-property(color) // -> red
```


### Transformations

`bu-transform` and `bu-operate` both can be passed a function to be called on a property value.

`bu-transform` uses the property value as the first function argument, and you can pass further arguments, either normally or as keywords.

```sass
.component
	@include bu-property(color, red)

	p
		@include bu-transform(color, fade-out, 0.1))
		@debug bu-property(color) // -> equivalent of 'fade-out(red, 0.1)'
```

`bu-operate` can use multiple properties, by referring to them as `'self.property-name'`, and it saves the result to the property name you pass. **Note**: because of a libsass bug, the function arguments have to be passed as keyword arguments.

```sass
.component
	@include bu-property(primary-color, red)
	@include bu-property(secondary-color, green)

	p
		@include bu-operate(color, mix, $color1: 'self.primary-color', $color2: 'self.secondary-color', $weight: 25%)

		@debug bu-property(color) // -> equivalent of 'mix($color1: red, $color2: green, $weight: 25%)'
```

Both of those functions can return and save at the same time.

```sass
.component
	@include bu-property(color, red)

	p
		color: bu-transform(color, fade-out, 0.1))

.different-component
	@include bu-property(primary-color, red)
	@include bu-property(secondary-color, green)

	p
		color: bu-operate(color, mix, $color1: 'self.primary-color', $color2: 'self.secondary-color', $weight: 25%)
```

`bu-look-transform` and `bu-look-operate` do the same thing as `bu-transform` and `bu-operate`, but they don't save the changed value. They just return it.


```sass
.component
	@include bu-property(color, red)

	p
		color: bu-look-transform(color, fade-out, 0.1))
		@debug bu-property(color) // -> still red


.different-component
	@include bu-property(primary-color, red)
	@include bu-property(secondary-color, green)

	p
		color: bu-operate(mix, $color1: 'self.primary-color', $color2: 'self.secondary-color', $weight: 25%)
		@debug bu-property(color) // -> null
```


### Descend and Extend

`bu-extend` and `bu-descend` are all about connecting a selector to another.

`bu-descend` can take any selector that is valid to put properties on, and basically "connects" your current selector to that tree.

```sass
.parent
	@include bu-property(color, red)
	&.background
		@include bu-property(background-color, green)
		&.border
			@include bu-property(border-color, silver)

.extendee
	@include bu-descend('.parent.background.border')

	@debug bu-property(color) // -> red
	@debug bu-property(background-color) // -> green
	@debug bu-property(border-color) // -> silver
```

You can descend from multiple selectors, and properties will be overwritten by the most recent thing you've descended.

```sass
.parent
	@include bu-property(color, red)
.other-parent
	@include bu-property(width, 100px)
.override
	@include bu-property(color, green)


.extendee
	@include bu-descend('.parent')
	@include bu-descend('.other-parent')
	@include bu-descend('.override')

	@debug bu-property(color) // -> green
	@debug bu-property(width) // -> 100px
```


`bu-extend` is like `bu-descend`, except it also calls sass `@extend` for you, so normal css attributes are extended as well. It also means that if a selector doesn't exist all in one piece, it won't work.

```sass
.base-component
	color: bu-property(color, red)
	width: 500px

.thing
	color: bu-property(color, green)
	&.state
		color: bu-property(color, blue)

.component
	@include bu-extend('.base-component') // works just fine
	@include bu-extend('.thing.state') // throws an error, since that selector technically doesn't exist all in one piece
```

This also works for extend-only placeholders.

```sass
%extend-placeholder
	color: bu-property(color, green)

.component
	color: bu-property(color, red)

	@include bu-extend('%extend-placeholder')

	p
		@debug bu-property(color) // -> green
```


### Complex Selectors and &

Some advanced uses of `&` cause unexpected behavior, and you need to use special mixins to make them work.

```sass
.container
	// saves on '.container'
	color: bu-property(color, red)

	#context &
		// looks for '#context .container', which has nothing, and then '#context', which has nothing.
		@debug bu-property(color) // -> null!
```

Potentially even more confusing:

```sass
#context
	color: bu-property(color, green)

.container
	color: bu-property(color, red)

	#context &
		// the search on '#context' finds something
		@debug bu-property(color) // -> green!
```

<!-- blaine we need to figure out what the consequences of using > + ~ *without* & are -->

To get the result you're expecting, use:

- `bu-inside` (`#context &`)
- `bu-child-of` (`#context > &`)
- `bu-after` (`#trigger + &`)
- `bu-before` (`#trigger ~ &`)


```sass
#context
	color: bu-property(color, green)

.container
	color: bu-property(color, red)

	@include bu-inside('#context')
		@debug bu-property(color) // -> red
```

When using the `&` as a *prefix*, everything should work fine.

```sass
.container
	color: bu-property(color, red)
	
	& ~ .before-thing
		@debug bu-property(color) // -> red

.btn
	color: bu-property(color, red)
	
	// this is a special case, but it still works!
	& + &
		@debug bu-property(color) // -> red
```



Bubble also includes `bu-at-root` so you can have the selectors in question output to root to keep them simple, but also keep referencing the parent context.

```sass
.container
	color: bu-property(color, red)

	@include bu-at-root('.different-container')
		@debug bu-property(color) // -> red
```

You can nest these to an arbitrary number of layers.

```sass
.container
	color: bu-property(color, red)

	@include bu-at-root('.different-container')
		@debug bu-property(color) // -> red

		@include bu-child-of('#content')
			@debug bu-property(color) // -> red
```

Suffixing of `&` also works with `bu-suffix`.

```sass
// without bu-suffix
#main
	color: bu-property(color, red)

	&-sidebar // compiles to #main-sidebar
		@debug bu-property(color) // -> null

#main
	color: bu-property(color, red)

	@include bu-suffix('-sidebar') // also compiles to #main-sidebar
		@debug bu-property(color) // -> red
```


<!-- Blaine, to achieve all of this, push to a global context stack right before including @content, and then pop immediately after -->
<!-- when checking for anything nested or related, check to see if context stack matches first? -->




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


perhaps by not specifically allowing overrides, but giving some logical functions to quickly determine what version we're in or whatever,

with overrides, we can:
- not allow them at all. rely on inheritance and just manually declaring things after the build or whatever. this means different versions can't use the state variables differently than each other
- give them a specific override function. this would only really work inside of the build, and would rely on the basic css override system


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
