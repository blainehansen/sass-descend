The Bones property system is a very simple way for you to have behavior similar to object oriented programming for your selectors/components. The basic function is `ds-property`, which comes in a mixin form to declare properties on the component in question. Here's a basic example.

```sass
.component
	// sets the color property on .component.
	@include ds-property(color, red)
	// will return red
	color: ds-property(color)

	&:hover
		// will still return red
		color: ds-property(color)
```

Essentially, any nested block has access to all properties set lower down in the chain.

You can override a property at higher levels of the chain, and it will take precedence.

```sass
.component
	@include ds-property(color, red)
	// will return red
	color: ds-property(color)

	.nested-component
		// will return red
		color: ds-property(color)

		@include ds-property(color, green)
		// now will return green
		color: ds-property(color)

		.further-nested
			// still returns green
			color: ds-property(color)
```

`ds-attribute` is a shortcut to set a property on your context, as well as to set that css attribute at the same time. Use this when the property and the css attribute have the same name.

```sass
.component
	// this will also set the color: attribute
	@include ds-attribute(color, red)

	&:hover
		// returns red as expected
		color: fade-out(ds-property(color), $amount)

	// ERROR: not a valid css attribute
	@include ds-attribute(made-up-attribute, red)
```

`ds-attribute-transform` and `ds-property-transform` both perform a function you pass and it's arguments on the specified attribute or property, respectively. `ds-attribute-transform` also applies that attribute at the current scope.

```sass
.component
	@include ds-attribute(color, red)
	
	&:hover
		// now this also will have the color: fade-out(red, $amount); output
		@include ds-attribute-transform(color, fade-out, $amount)

```

`ds-attribute-apply` takes an existing attribute definition that exists already in the context, and applies it to the current context.

```sass
.component
	@include ds-attribute(color, red)

	.sub-component
		// now this also will have the color: red; output
		@include ds-attribute-apply(color)
```


Everything still works even if you open up a selector at another time to add other things to it.

```sass
.component
	@include ds-property(color, red)

.parent-of .component
	// will return red
	color: ds-property(color)
```

Relational and attribute selectors work just fine, and allow access to the any of the targeted component's original declarations, but not the trigger's.

```sass
.component
	@include ds-property(color, red)

.trigger
	@include ds-property(font-size, 12px)

.trigger + .component
	// will return red
	color: ds-property(color)

	// ERROR: undefined
	font-size: ds-property(font-size)


.different-trigger
	@include ds-property(font-size, 16px)

.different-trigger .component[target=_blank]
	// will return red
	color: ds-property(color)

	// ERROR: undefined
	font-size: ds-property(font-size)
```

Beware, this only works if the original component was at the root.

```sass
.some-parent .component
	@include ds-property(color, red)

.trigger + .component
	// ERROR: undefined
	color: ds-property(color)
```

Pseudo selectors are handled gracefully, and basically ignored as is reasonable.
(we only ignore in the event that we fail to find the thing with the pseudos included?)
(we peel away until we fail to find anything at a pseudo level, then we try to find something with the pseudo stripped)

```sass
.component
	@include ds-attribute(color, red)

	.nested-thing
		@include ds-attribute(color, green)

	&:hover
		// will return red
		color: fade-out(ds-property(color), $amount)

		.nested-thing
			// will return green
			color: fade-out(ds-property(color), $amount)


.different-component
	@include ds-attribute(color, red)

	.different-nested-thing
		@include ds-attribute(color, green)

	&:hover
		@include ds-attribute(color, blue)

		.different-nested-thing
			// will return blue
			color: fade-out(ds-property(color), $amount)
```

There are two types, some that handle state and some that handle nature. Nature pseudo selectors are not stripped. State ones are.
Here are the state pseudo selectors that are stripped: (this is all questionable)

* :active
* :checked
* :disabled
* :enabled
* :focus
* :hover
* :link
* :visited

allow them to add to this list?
Maybe since we're allowing properties declared at the pseudo level to reset context, we should just strip all of them?

```sass
.component
	@include ds-attribute(color, red)

	.nested-thing
		@include ds-attribute(color, green)

	&:first-child
		// will return red
		color: fade-out(ds-property(color), $amount)

		.nested-thing
			// will return green
			color: fade-out(ds-property(color), $amount)
```



The only thing it will get mad about is comma separated selectors. This will throw an error:

```sass
.component, .other-component
	// ERROR: operation not allowed
	@include ds-property(color, red)
```

To achieve that same effect, use `ds-extend`. It allows you to inherit the context from one component to another.

```sass
.component
	@include ds-property(color, red)

.other-component
	@include ds-extend('.component')

	// will return red
	color: ds-property(color)
```

Any properties that were added as attributes will automatically be applied to the extending component.

```sass
.component
	@include ds-attribute(color, red)

.other-component
	// now this component has color: red;
	@include ds-extend('.component')
```


This even works with extend-only placeholders.

```sass
%abstract-component
	@include ds-property(color, red)

.concrete-component
	@include ds-extend('%abstract-component')

	// will return red
	color: ds-property(color)
```

Add a `ds-full-extend` to also do the sass version?


Do you typically use `@at-root` to keep your components organized into similar blocks? This still works great here, and `@at-root` will clear away any existing context.

```sass
.component
	@include ds-attribute(color, red)

	@at-root .different-component
		// ERROR: undefined
		color: ds-property(color)
```

If you want to keep the context around, just use `ds-descend`, which specifies a component selector that this one is a child of.

```sass
.component
	@include ds-attribute(color, red)

	@at-root .different-component
		@include ds-descend('.component')

		// will return red
		color: ds-property(color)
```

tolerate-undefined option? Make it so that errors aren't thrown when something doesn't exist?


compounding class selectors (but not id selectors) is the same as calling ds-extend on something?

element level selectors are *things*
id's specify *different versions* of a thing
classes specify a thing with *different qualities*
pseudos specify a thing in a *different state*
relationals specify a thing in a *different context*
attributes specify different attributes


Properties are resolved searching in this priority order:
- current
- extendents
- things with same leaf selector minus pseudo-classes from right to left
- things with same leaf selector minus attributes from right to left
- things with same leaf selector minus relational triggers from left to right in rightmost compound
- things with same leaf selector minus compounding selectors from right to left (split compounding?)
- things with same leaf selector minus pseudo-elements from right to left
- things with the exact same complete leaf selector, peeling root-most compounds from left to right
- peeled context, going into the possible descendant tree once that runs out.

[pseudo-classes and pseudo-elements](http://www.growingwiththeweb.com/2012/08/pseudo-classes-vs-pseudo-elements.html)


```sass
.container .other-container#main-thing:hover .trigger[target=_blank]+.parent.right.green .finally:hover
.container .other-container#main-thing .trigger[target=_blank]+.parent.right.green .finally:hover
.container .other-container#main-thing .trigger+.parent.right.green .finally:hover
.container .other-container#main-thing .parent.right.green .finally:hover
.container .other-container#main-thing .parent.right .finally:hover
.container .other-container#main-thing .parent .finally:hover
.container .other-container .parent .finally:hover
.other-container .parent .finally:hover
.parent .finally:hover
.finally:hover

.container .other-container#main-thing:hover .trigger[target=_blank]+.parent.right.green .finally
	// recurse




.container .other-container:hover .trigger[target=_blank]+.parent.right.green[target=_blank] .finally:hover
.container .other-container .trigger[target=_blank]+.parent.right.green[target=_blank] .finally:hover
```

recursive structure:
first check if selector is empty
then fetch at this selector
then look for extendents, call self on them if found.

gauntlet of checks.
each mutates and checks if result is different.
if it's different, call self.
otherwise continue down gauntlet





*descent* is for connecting a block at the root to another tree. Something can't be in two trees simultaneously, so it must be at root, but can connect to anything (except crazy stuff). this creates a linkage rather than copying.
we could also call this something like *tapping* or *connecting*
*inheritance* is about deployability. it's about remembering a bunch of *up-tree* stuff that you can redeploy at any time. the deployable declaration traps up-tree declarations, but you can be at whatever level, and use your previous tree to inform the new attributes. this copies. require deploy?
*extension* is a layer on top of sass behavior, giving the caller the same access to properties on extended selectors that the css layer gives for attributes.

perhaps the deployable features should be a separate library (or namespace) that is compatible?

`ds-deployable` must be at root, a declaration of a new type.
`ds-deployable-inherit` can be anywhere. you can make a deployable also inherit from something, but it's still necessary to put this at root in that situation. then any vanilla css declarations will get used when you call this elsewhere.
both of these trap upstream declarations and references of all kinds, and can use those when deploying.

the `ds-deployable` could simply check to see if the one argument was empty or not, and treat empty like a base declaration, and a not empty like a 




create a ds-instantiate or whatever that deploys sub-selectors with all their attributes, taking into account any changes you made at this layer.





`sb-property` mixin declares, function retrieves
`sb-attribute` mixin declares and outputs
`sb-descend` mixin makes the current selector a child of passed selector
two ways of thinking about this one. either it copies everything which means it's a snapshot and downstream changes to the parent won't effect downstream references on the child,
or a linkage is made, which will effect downstream children from downstream parents.

`sb-property-transform` mixin changes the property value with passed function. places that transformed value at the current context, not at the context where the value was found.
`sb-attribute-transform` mixin performs property transform and then outputs

`sb-attribute-apply` mixin applies existing attribute at current level.


selectors with compounded classes like `.red.blue.green` will be resolved in right to left order, meaning that the later the class is placed, the more precedence it will take.



how to handle "relation" selectors?    > + ~
perhaps we just purge them? and only allow them at root?
we definitely need to support *lookup* in the selected element.

`>` is simple, we just purge it and replace it with a space. our existing algorithm can handle that.
or at least so it seems. keeping these allows for much more specificity. We should allow these to be purged during lookup at the original, but not at the beginning.
`+` and `~`, if purged, should have the triggering selector purged as well.
if purged, that means we support lookup at original definition, and nesting these is okay too.
the problem with purging in this way is that we would overwrite the original definition.





The whole purpose of this properties system is to:
allow abstract transformations of values set at previous points
allow reuseable components that simply perform changes based on transformation definitions
allow components that callers can reuse or change or transform the attributes of
it's all about minimizing repetition and boilerplate


difference between inheriting (which is just linking the contexts together, perhaps even copying them), and deployable components. The algorithm can handle normal situations if it's just about storing and reference. But the deployables are capable of remembering transformations at greater levels of nesting, of deploying entire trees based on previous ones, of deploying them with current changes remembered. Deployables are above and beyond.