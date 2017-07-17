### This project is in active development.

**It is not ready for use, but Pull Requests are welcome!**
  
Go ahead and contact me if you'd like to help with any of the following tasks, or if you have input or thoughts about the library.

Roadmap:

- [] Implement Complex Selector mixins.
- [] Unit tests (probably using [true](https://www.npmjs.com/package/sass-true)).
- [] Make useable as node package on npm.
- [] Create Webpack plugin.
- [] Create Gulp plugin.
- [] Create Grunt plugin.
- [] Make useable as Meteor package.
	- [] Either finalize [fourseven:scss pull request](https://github.com/fourseven/meteor-scss/pull/238) to allow custom javascript functions, or create and maintain a fork of that project allowing it.
- [] Make useable by ruby sass.
	- [] Write ruby versions of custom functions.


# Descend, property lookup for sass

This library allows you to save properties on your selectors, and then recall them, much like is allowed by [stylus](http://stylus-lang.com/docs/variables.html#property-lookup). It does so in a simple way, just looking up the nesting tree.

The basic use is simple. Just store a property on your selector, and it's available at that level and any deeper level.

```sass
.container
	@include ds-property(color, red)
	color: ds-property(color) // -> red

	&:hover
		color: ds-property(color) // -> red
```

You can override properties.

```sass
.container
	@include ds-property(color, red)

	.other
		@include ds-property(color, green)
		color: ds-property(color) // -> green

		&.open
			color: ds-property(color) // -> green
```

It looks for the property naively, so it won't consider things of similar names.

```sass
.container
	@include ds-property(color, red)

	.nested
		@include ds-property(color, green)

	&:hover
		color: ds-property(color) // -> red

		.nested
			color: ds-property(color) // -> still red, even though theoretically it would make sense to be green
```

You can save a property and output it as css at the same time.

```sass
.component
	color: ds-property(color, red)
```
```css
.component {
	color: red;
}
```

If you define a property on something, and then open up that same selector again later, the property will still be available.

```sass
.container
	@include ds-property(color, red)

	.nested
		@include ds-property(color, green)

.container
	@debug ds-property(color) // -> red

	.nested
		@debug ds-property(color) // -> green

.container ~ .previous-block
	@debug ds-property(color) // -> red
```


### Transformations

`ds-transform` and `ds-operate` both can be passed a function to be called on a property value.

`ds-transform` uses the property value as the first function argument, and you can pass further arguments, either normally or as keywords.

```sass
.component
	@include ds-property(color, red)

	p
		@include ds-transform(color, fade-out, 0.1))
		@debug ds-property(color) // -> equivalent of 'fade-out(red, 0.1)'
```

`ds-operate` can use multiple properties, by referring to them as `'self.property-name'`, and it saves the result to the property name you pass. **Note**: because of a libsass bug, the function arguments have to be passed as keyword arguments.

```sass
.component
	@include ds-property(primary-color, red)
	@include ds-property(secondary-color, green)

	p
		@include ds-operate(color, mix, $color1: 'self.primary-color', $color2: 'self.secondary-color', $weight: 25%)

		@debug ds-property(color) // -> equivalent of 'mix($color1: red, $color2: green, $weight: 25%)'
```

Both of those functions can return and save at the same time.

```sass
.component
	@include ds-property(color, red)

	p
		color: ds-transform(color, fade-out, 0.1))

.different-component
	@include ds-property(primary-color, red)
	@include ds-property(secondary-color, green)

	p
		color: ds-operate(color, mix, $color1: 'self.primary-color', $color2: 'self.secondary-color', $weight: 25%)
```

`ds-look-transform` and `ds-look-operate` do the same thing as `ds-transform` and `ds-operate`, but they don't save the changed value. They just return it.


```sass
.component
	@include ds-property(color, red)

	p
		color: ds-look-transform(color, fade-out, 0.1))
		@debug ds-property(color) // -> still red


.different-component
	@include ds-property(primary-color, red)
	@include ds-property(secondary-color, green)

	p
		color: ds-operate(mix, $color1: 'self.primary-color', $color2: 'self.secondary-color', $weight: 25%)
		@debug ds-property(color) // -> null
```


### Descend and Extend

`ds-extend` and `ds-descend` are all about connecting a selector to another.

`ds-descend` can take any selector that is valid to put properties on, and basically "connects" your current selector to that tree.

```sass
.parent
	@include ds-property(color, red)
	&.background
		@include ds-property(background-color, green)
		&.border
			@include ds-property(border-color, silver)

.extendee
	@include ds-descend('.parent.background.border')

	@debug ds-property(color) // -> red
	@debug ds-property(background-color) // -> green
	@debug ds-property(border-color) // -> silver
```

You can descend from multiple selectors, and properties will be overwritten by the most recent thing you've descended.

```sass
.parent
	@include ds-property(color, red)
.other-parent
	@include ds-property(width, 100px)
.override
	@include ds-property(color, green)


.extendee
	@include ds-descend('.parent')
	@include ds-descend('.other-parent')
	@include ds-descend('.override')

	@debug ds-property(color) // -> green
	@debug ds-property(width) // -> 100px
```


`ds-extend` is like `ds-descend`, except it also calls sass `@extend` for you, so normal css attributes are extended as well. It also means that if a selector doesn't exist all in one piece, it won't work.

```sass
.base-component
	color: ds-property(color, red)
	width: 500px

.thing
	color: ds-property(color, green)
	&.state
		color: ds-property(color, blue)

.component
	@include ds-extend('.base-component') // works just fine
	@include ds-extend('.thing.state') // throws an error, since that selector technically doesn't exist all in one piece
```

This also works for extend-only placeholders.

```sass
%extend-placeholder
	color: ds-property(color, green)

.component
	color: ds-property(color, red)

	@include ds-extend('%extend-placeholder')

	p
		@debug ds-property(color) // -> green
```


### Complex Selectors and &

**This functionality isn't yet implemented.**

Some advanced uses of `&` cause unexpected behavior, and you need to use special mixins to make them work.

```sass
.container
	// saves on '.container'
	color: ds-property(color, red)

	#context &
		// looks for '#context .container', which has nothing, and then '#context', which has nothing.
		@debug ds-property(color) // -> null!
```

Potentially even more confusing:

```sass
#context
	color: ds-property(color, green)

.container
	color: ds-property(color, red)

	#context &
		// the search on '#context' finds something
		@debug ds-property(color) // -> green!
```

<!-- blaine we need to figure out what the consequences of using > + ~ *without* & are -->

To get the result you're expecting, use:

- `ds-inside` (`#context &`)
- `ds-child-of` (`#context > &`)
- `ds-after` (`#trigger + &`)
- `ds-before` (`#trigger ~ &`)


```sass
#context
	color: ds-property(color, green)

.container
	color: ds-property(color, red)

	@include ds-inside('#context')
		@debug ds-property(color) // -> red
```

When using the `&` as a *prefix*, everything should work fine.

```sass
.container
	color: ds-property(color, red)
	
	& ~ .before-thing
		@debug ds-property(color) // -> red

.btn
	color: ds-property(color, red)
	
	// this is a special case, but it still works!
	& + &
		@debug ds-property(color) // -> red
```



Descend also includes `ds-at-root` so you can have the selectors in question output to root to keep them simple, but also keep referencing the parent context.

```sass
.container
	color: ds-property(color, red)

	@include ds-at-root('.different-container')
		@debug ds-property(color) // -> red
```

You can nest these to an arbitrary number of layers.

```sass
.container
	color: ds-property(color, red)

	@include ds-at-root('.different-container')
		@debug ds-property(color) // -> red

		@include ds-child-of('#content')
			@debug ds-property(color) // -> red
```

Suffixing of `&` also works with `ds-suffix`.

```sass
// without ds-suffix
#main
	color: ds-property(color, red)

	&-sidebar // compiles to #main-sidebar
		@debug ds-property(color) // -> null

#main
	color: ds-property(color, red)

	@include ds-suffix('-sidebar') // also compiles to #main-sidebar
		@debug ds-property(color) // -> red
```


<!-- to achieve all of this, push to a global context stack right before including @content, and then pop immediately after -->
<!-- when checking for anything nested or related, check to see if context stack matches first? -->
