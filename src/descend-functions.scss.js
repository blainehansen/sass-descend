const sass = Npm.require('node-sass');

const arrayToSassList = function (array) {
	var list = new sass.types.List(array.length)

	for (var i = 0; i < array.length; i++) {
		list.setValue(i, new sass.types.String(array[i]))
	}

	return list;
}

const arrayToSassString = function (array) {
	return new sass.types.String(array.join(' '))
}


const peelPseudoElement = function (compound) {
	return compound.replace(/::[a-z\-]+$/i, '')
}
const peelPseudoClass = function (compound) {
	return compound.replace(/:[a-z\-]+$/i, '')
}
const peelAttribute = function (compound) {
	return compound.replace(/\[[^\]]+\]$/, '')
}
const peelCompounding = function (compound) {
	return compound.replace(/[\.\#][\w\-]+$/, '')
}
const peelElement = function (compound) {
	return compound.replace(/[a-z1-6]+$/i, '')
}

const peelGauntlet = [peelPseudoElement, peelPseudoClass, peelAttribute, peelCompounding, peelElement]

var customFunctions = {
	'-ds-sanify-selector($selector)': function (selector) {
		selector = selector.getValue()

		selector = selector.replace(/ ([\>\+\~]) /g, '$1')

		// remove whitespace around attribute equalities
		selector = selector.replace(/ *([\^\|\*\$\~]?\=) */g, '$1')

		// remove whitespace around attribute key value pairs
		selector = selector.replace(/(\[) *(\S*?) */g, '$1$2')
		selector = selector.replace(/ *(\S*?) *(\])/g, '$1$2')

		return new sass.types.String(selector)
	},
	'-ds-peel-selector($selector)': function (selector) {
		var ancestorsArray = selector.getValue().split(' ')
		if (ancestorsArray.length == 0) return sass.types.Null.NULL

		var oldLeaf = ancestorsArray.splice(-1, 1)[0]
		if (oldLeaf) {
			var newLeaf
			for (var peelFunction of peelGauntlet) {
				newLeaf = peelFunction(oldLeaf)

				if (newLeaf != oldLeaf) {	
					newLeaf = newLeaf.replace(/[\~\+\>]$/, '')
						
					if (newLeaf) {
						ancestorsArray.push(newLeaf)
					}

					return arrayToSassString(ancestorsArray)
				}
			}
		}
		
		return arrayToSassString(ancestorsArray);
	},
	'-ds-get-property-name-arg($value)': function (value) {
		value = value.getValue()

		if (typeof value != "string") {
			return sass.types.Null.NULL
		}

		value = value.match(/^self\.([\w\-]+)$/)
		if (!value) {
			return sass.types.Null.NULL
		}

		return new sass.types.String(value[1])
	},
	// '-dy-parse-current-deployable($manifest, $selector)': function (manifest, selector) {

	// },
	// '-dy-parse-current-deployable($manifest, $selector)': function (manifest, selector) {
	// 	selector = selector.getValue()
	// 	console.log(selector)
	// 	var item
	// 	var matches = []
	// 	for (var i = 0; i < manifest.getLength(); i++) {
	// 		item = manifest.getValue(i).getValue()

	// 		console.log(item)
	// 		var count = (selector.match(new RegExp(item, 'g')) || []).length;
	// 		console.log(count);
	// 	}

	// 	return new sass.types.String('dy-default')
	// },
	'-dy-parse-current-version($deployable, $selector)': function (deployable, selector) {
		deployable = deployable.getValue()
		selector = selector.getValue()

		var replaceAmp = '&'
		selector = selector.replace(new RegExp(deployable, 'g'), replaceAmp)

		if (selector == replaceAmp) {
			return new sass.types.String('dy-default')
		}
		else {
			return new sass.types.String(selector)
		}
	}
};
customFunctions