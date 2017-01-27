## Basic Properties (Bubble)

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


## Transformations

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


## Extend

`bu-extend` can be used identically to normal sass `@extend`, giving you access to the properties of the extended selector. And it calls sass `@extend` for you in the process.

```sass
.base-component
	@include bu-attribute(color, red)
	width: 500px

.component
	@include bu-extend('.base-component')

	p
		@include bu-attribute-transform(color, adjust-hue, 120) // basically results in green
```
```css
.base-component, .component {
	color: red;
	width: 500px;
}

.component p {
	color: green;
}
```

It works for extend-only placeholders, and you can extend multiple selectors. Any property that already existed at this layer will be overwritten by `bu-extend`, and that includes properties from previous extends.

```sass
%thingy
	@include bu-attribute(color, green)

%other-thingy
	@include bu-attribute(font-size, 20px)

.dealy
	@include bu-attribute(color, silver)

.component
	@include bu-property(color, red) // -> will be overwritten!

	@include bu-extend('%thingy')
	@include bu-extend('%other-thingy')
	@include bu-extend('.dealy')

	p
		@include bu-apply(color) // -> silver, because .dealy was called most recently
		@include bu-apply(font-size) // -> 20px
```
```css
.dealy, .component {
	color: silver;
}

.component p {
	color: silver;
	font-size: 20px;
}
```


## Complex Selectors and &

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

// 
#main
	color: bu-property(color, red)

	@include bu-suffix('-sidebar') // also compiles to #main-sidebar
		@debug bu-property(color) // -> red
```


<!-- Blaine, to achieve all of this, push to a global context stack right before including @content, and then pop immediately after -->
<!-- when checking for anything nested or related, check to see if context stack matches first? -->
