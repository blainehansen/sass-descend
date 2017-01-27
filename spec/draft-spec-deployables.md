so we're coming to the realization that there are two completely distinct ways of thinking about lookup.
there's the bubble method, which is only hoping to find things at the closest lower level of nesting
there's the object method, which hopes to find them on an equal or less specific version of the current leaf selector

in the bubble, we're taking on the attributes of our environment.
in the object, we're transforming into different versions of ourselves.

`ds-deployable` declares something
`ds-deployable-property` places a property
`ds-deployable-depend`, `dy-require`  requires a property from the parent tree, takes a default?
`ds-deployable-transform`
`ds-deployable-apply`

so you need to be able to nest deployables, but you always declare at the bottom. You can deploy a deployable inside another deployable, but not declare one.



`dy-state`?


```sass
.deployable-component
	@include dy-deployable()
	@include dy-state(color, red)
	// @include dy-require(gutter-width) // -> if this isn't provided at deploy time, and no default, error
	@include dy-require(gutter-width, $default: 10px) // -> we have to provide a default, if the deployable isn't an extend-only? if it isn't an extend-only then we need to be able to build the entire default version of the deployable, whereas an extend-only doesn't require that.
	// similarly, if any requires 

	.sub-box
		@include bu-property(width, 50px)
		@include dy-state-apply(color, background-color)
		@include dy-state-operate(color, adjust-hue, $color: 'self.color', $degrees: 120))

		&:hover
			@include dy-state(color, green) // -> not allowed, state can only be declared on deployables or their states/contexts/versions
			@include bu-transform(width, 10px) // -> if no function is provided, but instead a value, the value is added to the property, so if it's negative it's substracted.
			// perhaps allow a special case for calc

	.context &.big
		// more specific states override sub-states, even if defined earlier
		@include dy-state(color, silver)

	.context &
		@include dy-state(color, orange)

	&.open
		@include dy-state(color, blue) // -> for states that conflict with each other and multiple things are combined at deploy time, the last defined wins.
		// so in this situation, if something was both in .context and was .open, .open would win and color would be blue
		@include dy-state-transform(gutter-width, -5px)

	&:hover
		@include dy-state-transform(color, fade-out, 0.1)

	@include ds-deployable-build() // -> deploys, and locks the build so further references know they're in override.


.other-deployable
	@include dy-deployable()
	@include dy-state(border-radius, 10px)
	@include dy-require(color, $default: green)

	.nested
		@include dy-state-transform(color, adjust-hue, 80)

	&:hover
		@include dy-state(border-radius, 8px)



.different-container
	@include bu-property(gutter-width, 8px)

	.blog-post
		@include dy-deployable-inherit('.deployable-component')
		background-image: url('thing') // other random stuff	
		@include dy-state(color, gold)

		&.open
			@include dy-state(color, gold)

		@include dy-deploy()

#parent
	@include bu-property(gutter-width, 6px)

	.deployable-component
		@include dy-deploy()
```











```sass
.container
	@include ds-property(color, red)

	#context &
		@debug tree-property(color) // -> red
		@include ds-property(color, blue)

	.nested
		@include ds-property(color, green)

	&:hover
		@debug tree-property(color) // -> red

		.nested
			@debug tree-property(color) // -> red, misses the green.
```



```sass
.deployable-component
	// only allow this with a simple single selector? no adding of classes to modify? only at root?
	@include deployable()
	@include dy-property(color, red)

	.sub-box
		@include bn-transform(fade-out, 'this.color', $amount)
		&:hover
			@include bn-transform(fade-out, 'this.color', $greaterAmount)
	
	&:hover
		@include bn-property(color, green)

	@include bn-deploy()


.inheriting-component
	@include bn-inherit('.deployable-component')
	@include bn-property(color, yellow)

	.sub-box
		@include bn-transform(adjust-hue, 'this.color', $degrees)
		&:hover
			@include bn-transform(adjust-hue, 'this.color', $greaterDegrees)
	

	@include bn-deploy()

.container
	.deployable-component
		@include bn-property(color, blue)
		@include bn-deploy()
```




`ds-property` stores
you can only store on a thing, so something in the form `elem.class#id[attr]::pseudo`

`ds-self` looks on the current leaf selector only
`ds-parent` looks starting from the next level, so after a peel

`ds-inherit` takes a property or list of properties from the parent, and saves it here
`ds-inherit-apply` does the same but outputs them



You can mix references and state assignments

I'll refer to any block with an & in it as a version, and just nested stuff as a nested.
Nesteds can only make references to state properties. They can't set them.
Versions can do both.

so we have
- overrides
- transforming references
- references

For every override (in a version), every nested has to be output, and then every nested (under a compounding version) for each version that makes a transforming reference to this state property.

so when .open-state was built, it had to output all nesteds with the repercussions, and then all of those repercussions again with the transforming reference from :hover.

When instantiations are made, we can not do this work for any completely overridden versions.


you can't override a state that you've already saved on this version
this also means you can't define an override and a transformation of the same state property on one version
you also can't reference a state property that hasn't been defined or required.


a single version can only either perform overrides or transformations?

for every version override, you have to output all nesteds, then each nested compounded with each version transformation 


The dynamic state ui psuedo-classes are only allowed to have transformations, because there's an assumption that they will be compounded with pretty much everything.

Any *version* is only allowed to have transformations? And different contexts are only allowed to have overrides?


You can make state overrides or transformations on any version of the component, *but*, you can only do one or the other. All override versions are run with each combination of all the transformation versions.

Things that compete with each other: the last thing defined wins.

```sass
.deployable-component
	// @include dy-deployable($compound: false) // if you don't want the versions combined.
	// @include dy-deployable($compound: (':hover', ':active')) // if you only want certain things compounded
	// perhaps just have a default list? like only the dynamic ui state pseudos?
	// default that would make most sense: (:hover, :active, :focus, :enabled, :disabled)
	// allow the above with a shorthand, like dynamic-psuedos
	// but... people might define transformations in other ways. just giving them control is good enough

	@include dy-deployable() // -> activates this selector as a deployable, only valid at root
	@include dy-state(color, red) // -> saves the default state

	.nested-block
		@include dy-state-apply(color)

	// override versions
	&.open
		@include dy-state(color, blue)

	&.open.big
		@include dy-state(color, green)

	// transform versions
	&.big
		@include dy-state-transform(color, fade-out, 0.1)


	@include dy-deployable-build()
```


```sass
.deployable-component
	.nested-block
		color: red

	&.big
		.nested-block
			color: fade-out(red, 0.1)


	&.open
		.nested-block
			color: blue

	// with the override
	&.open.big
		.nested-block
			color: green

	// but this is what it would be without the override
	// usually, we would have arrived at this combination when applying the various transforming versions (.big) to the override versions (.open), but when we arrive at that, we need to know that the combined form has been overridden as an override version.
	&.open.big
		.nested-block
			color: fade-out(blue, 0.1)
```


HMmmm

```sass
.deployable-component
	@include dy-deployable() // -> activates this selector as a deployable, only valid at root
	@include dy-state(color, red) // -> saves the default state

	.nested-block
		@include dy-state-apply(color)

	// override versions
	&.open
		@include dy-state(color, blue)


	// transform versions
	// don't allow this. you can't override a version with a transformation.
	// this is an override of .open, because it's a more specific version of it
	&.open.big
		@include dy-state-transform(color, fade-out, 0.2)

	&.big
		@include dy-state-transform(color, fade-out, 0.1)


	@include dy-deployable-build()
```

```sass
.deployable-component
	.nested-block
		color: red

	&.big
		.nested-block
			color: fade-out(red, 0.1)
			
	&.open.big
		.nested-block
			color: fade-out(red, 0.2)


	&.open
		.nested-block
			color: blue
```
















```sass
.deployable-component
	@include dy-deployable() // -> activates this selector as a deployable, only valid at root
	@include dy-state(color, red) // -> saves the default state
	@include dy-state(gutter-width, 10px) // -> saves the default state

	.nested-block
		@include dy-state-apply(color) // references a state property
		@include dy-state-apply(gutter-width, margin) // references a state property

	&.certain-type
		// for state changes (overrides), you apply all the cascading references
		// state changes are the actor and call all state references
		@include dy-state(gutter-width, 5px)
		@include dy-state(color, blue) // changes a state property when the deployable fits this version

	&.open
		@include dy-state-transform(gutter-width, 5px)
		@include dy-state-transform(color, fade-out, 0.1) // references a state property

	&:hover
		// for state references, you just output and then wait to be remembered by a state change.
		@include dy-state-transform(gutter-width, 5px)
		@include dy-state-transform(color, fade-out, 0.1) // references a state property

	@include dy-deployable-build() // closes the deployable definition and builds it
```
compiles to the equivalent of this:

```sass
.deployable-component
	.nested-block
		color: red
		margin: 10px

	&:hover
		.nested-block
			color: fade-out(red, 0.1)
			margin: 15px


	&.certain-type
		.nested-block
			color: blue
			margin: 5px

		&:hover
			.nested-block
				color: fade-out(blue, 0.1)
				margin: 10px
```
