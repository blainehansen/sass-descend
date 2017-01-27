Descend has two separate systems for storing and retrieving values, one based on the tree (Bubble), and the other based on the concept of a component with different states (Deployable).





























Descend is a library that allows you to store properties on your selectors, and retrieve them at deeper levels.

It's incredibly flexible, and searches deeply for the most specific version of this thing it can.

Here's a basic example.

```sass
.component
	// sets the color property on .component.
	@include ds-property(color, red)
	color: ds-property(color) // -> red

	&:hover
		color: ds-property(color) // -> still red
```

You can give your properties any name that's a valid sass identifier, as either a quoted or unquoted string.

```sass
.component
	// sets the color property on .component.
	@include ds-property(my-color, red)
	color: ds-property('my-color') // -> red

	@include ds-property('quote-color', red)
	color: ds-property(quote-color) // -> still red

	@include ds-property('!@#@#$stuff', red) // -> ERROR: invalid identifier
```


You can override parent values at deeper levels.

```sass
.component
	@include ds-property(color, red)
	color: ds-property(color) // -> red

	.nested-component
		color: ds-property(color) // -> red

		@include ds-property(color, green)
		color: ds-property(color) // -> green

		.further-nested
			color: ds-property(color) // -> green
```

Descend searches for every version of the current selector before going up the tree. In this example it searches for all versions of `.child-component` first.

```sass
.component
	// saves on '.component'
	@include ds-property(color, red)
	
	.child-component
		// saves on '.component .child-component'
		@include ds-property(color, green)

	&:hover
		color: ds-property(color) // -> red

		.child-component
			color: ds-property(color) // -> green
			// anything that's under .child-component takes precedence
```

<!-- things vs states -->
Descend makes a distinction between *things* and *contexts* and *states*.

Things are:

- An element (`div`, `a`, `span`, `section`, etc.)
- An element with an id (`#content`)
- An element with a single class (`.blog-post`)
- Psuedo-elements (`::before`, `::after`, etc.)
- Any combination of those things (`a#header.important`, `.out-link::after`, `#content.blog-post`)


Contexts refer to things in different situations:

- A thing inside another thing (`.blog-post #social-panel`, so now `#social-panel` has changed contexts)
- A thing that's a direct child of another thing (`#content > a`)
- A thing that's a sibling of another thing (`.panel ~ .big-text`, `#hero-panel + p`)
- Structural pseudo-classes (`#content:first-child`, `.table-row:nth-of-type(3)`, etc.)


States are the dynamic and element state psuedo-classes:

- `:link`
- `:visited`
- `:hover`
- `:active`
- `:focus`
 
- `:enabled`
- `:disabled`
- `:checked`

- as well as things with more than one class (`#user-form.big-panel.open.important`)

Any attempt to add selectors on something with a *state* won't be allowed. Instead you should use a combination of transforms and extends.


<!-- ds-self-property vs ds-parent-property? -->
<!-- consider adding a ds-parent-property that doesn't look for other versions of this thing but just peels -->




This is even true if you have something right below it in the nesting.

```sass
.component
	// saves on '.component'
	@include ds-property(color, red)
	
	.child-component
		// saves on '.component .child-component'
		@include ds-property(color, green)

	&:hover
		// saves on '.component:hover .child-component'
		@include ds-property(color, blue)
		color: ds-property(color) // -> blue

		.child-component
			color: ds-property(color) // -> green
			// anything that's under .child-component takes precedence
```

### Search Order and Precedence

The search order is powerful and semantic, but it can be a little hard to get at first.

Here's the search order breakdown of a really hairy selector. Frankly, if you ever have something this complex, you've probably done something wrong, but it doesn't hurt to understand.

```sass
.container
	.other-container
		&:hover
			.trigger[target=_blank]:hover+.parent.right.green[target=_blank]
				.finally
					&:hover
						// if we do this
						color: ds-property(color)

// that first searches the complete selector
.container .other-container:hover .first+.trigger[target=_blank]:hover+.parent.right.green[target=_blank] .finally:hover

// then we look for any matching but less specific things with the same leaf selector (.finally:hover)

// we start by removing pseudo-classes from right to left
.container .other-container:hover .first+.trigger[target=_blank]+.parent.right.green[target=_blank] .finally:hover
.container .other-container .first+.trigger[target=_blank]+.parent.right.green[target=_blank] .finally:hover

// then attributes from right to left
.container .other-container .first+.trigger[target=_blank]+.parent.right.green .finally:hover
.container .other-container .first+.trigger+.parent.right.green .finally:hover

// triggering relationals from left to right in the rightmost compound
.container .other-container .trigger+.parent.right.green .finally:hover
.container .other-container .parent.right.green .finally:hover

// compounding selectors from right to left
.container .other-container .parent.right .finally:hover
.container .other-container .parent .finally:hover

// the root most selector
.other-container .parent .finally:hover
.parent .finally:hover
.finally:hover

// and then finally we peel any less important things off the leaf and repeat the process...
// we do that in the same order we removed them in the previous steps
.container .other-container:hover .first+.trigger[target=_blank]:hover+.parent.right.green[target=_blank] .finally
	// etc...


// and once the leaf is completely bare, we go up to the parent in the original selector
.container .other-container:hover .first+.trigger[target=_blank]:hover+.parent.right.green[target=_blank]
	// etc...
```


### Other Blocks

You have access to properties on any less specific but still matching versions of the current selector.

```sass
.component
	@include ds-property(color, red)

.parent-of .component
	color: ds-property(color) // -> red
```

This even works with multiple levels of nesting.

```sass
.container .component
	@include ds-property(color, red)

#content .container .component
	color: ds-property(color) // -> red
```

And it cascades down to deeper levels if nothing's found.


```sass
.container
	@include ds-property(color, red)

#content .container .component
	color: ds-property(color) // -> red
```

But of course, *more* specific or conflicting versions don't work like that.

```sass
#content .component
	@include ds-property(color, red)

.container .component
	color: ds-property(color) // -> null


.component:hover
	@include ds-property(color, red)

.component
	color: ds-property(color) // -> null


a[target=_blank]
	@include ds-property(color, red)

a
	color: ds-property(color) // -> null
```

Flipping those two previous examples around makes them work great.

```sass
.component
	@include ds-property(color, red)

.component:hover
	color: ds-property(color) // -> red


a
	@include ds-property(color, red)

a[target=_blank]
	color: ds-property(color) // -> red
```


### Triggers

When a selector is triggered by another, properties are still available.

```sass
.component
	@include ds-property(color, red)

.trigger + .component
	color: ds-property(color) // -> red
```

It works when used with the `&` selector as well.

```sass
.component
	@include ds-property(color, red)

	.trigger ~ &
		color: ds-property(color) // -> red

	.other-trigger + .container ~ &
		color: ds-property(color) // -> red

	.another-trigger > .different-container + &
		color: ds-property(color) // -> red
```

With `~` and `+`, you don't have access to any of the trigger properties.

```sass
.trigger
	@include ds-property(font-size, 12px)

.different-trigger
	@include ds-property(font-size, 16px)

.trigger + .component
	font-size: ds-property(font-size) // -> null

.different-trigger ~ .component
	font-size: ds-property(font-size) // -> null
```

Right now the `>` isn't supported in this way, but the plan is to treat it like a normal nesting structure down the road.

<!-- The `>` operator is treated slightly differently. Since it still represents nesting, just in a more specific way than normal nesting, it still works.

```sass
.trigger-but-really-parent
	@include ds-property(font-size, 12px)

.trigger-but-really-parent > .component
	font-size: ds-property(font-size) // -> 12px
``` -->


### Compounding Selectors

Compounding selectors are evaluated by peeling from right to left.

```sass
.component
	@include ds-property(color, red)

.component.layer-one
	@include ds-property(color, blue)

.component.layer-one.layer-two
	@include ds-property(color, green)


// right now these properties are completely ignored
.layer-one
	@include ds-property(color, silver)

.layer-one
	@include ds-property(color, gold)


.container .component
	color: ds-property(color) // -> red

	&.layer-one
		color: ds-property(color) // -> blue

		&.layer-two
			color: ds-property(color) // -> green

	&.layer-two
		color: ds-property(color) // -> green

	&.layer-two.layer-one
		// BUG
		color: ds-property(color) // -> red
		// since these aren't in the same order as the place the property was declared,
		// it falls back to .component
		// this is on the near future roadmap to be fixed
```


### No Comma Selectors

Comma separated lists of selectors aren't allowed.

```sass
.component, .other-component
	@include ds-property(color, red) // -> ERROR: not allowed
```

Read on to the [extend functionality]() to see how you can pull off the same thing.

```sass
.component
	@include ds-property(color, red)

.other-component
	@include ds-extend('.component')
	color: ds-property(color) // -> red
```