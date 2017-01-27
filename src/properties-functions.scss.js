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

const lastInstanceRegex = function (regex) {
	var r = regex.source
	var chars = /[\S]/
	chars = chars.source
	return new RegExp(r + '(?!' + chars + '+?' + r + ')')
}

// perhaps accept a purging function rather than regexes etc?
// const rightLeftRemove = function (selector, regex, regexLast, replaceString) {
const rightLeftRemove = function (selector, purgeFunction) {
	// if (regexLast == true || typeof regexLast == 'undefined') {
	// 	regex = lastInstanceRegex(regex)
	// }

	// if (!replaceString) {
	// 	replaceString = ''
	// }

	var ancestorsArray = selector.getValue().split(' ')

	var i, item, changedItem, giveValues
	for (i = ancestorsArray.length - 2; i >= 0; i--) {
		item = ancestorsArray[i]

		// console.log(item)
		// changedItem = item.replace(regex, '')
		changedItem = purgeFunction(item)
		// console.log(changedItem)

		if (changedItem != item) {
			ancestorsArray[i] = changedItem
			return arrayToSassString(ancestorsArray)
		}
	}

	return selector
}


// have a series of functions able to purge something from a single compound

// - things with same leaf selector minus pseudo-classes from right to left
const purgeCompoundPseudoClass = function (compound) {
	return compound.replace(lastInstanceRegex(/:[a-z\-]+/), '')
}
// - things with same leaf selector minus attributes from right to left
const purgeCompoundAttribute = function (compound) {
	return compound.replace(lastInstanceRegex(/\[[^\]]+\]/), '')
}
// - things with same leaf selector minus relational triggers from left to right in rightmost compound
const purgeCompoundRelational = function (compound) {
	return compound.replace(lastInstanceRegex(/^[^\>\~\+]+[\>\~\+]/), '')
}
// - things with same leaf selector minus compounding selectors from right to left (split compounding?)
const purgeCompoundCompounding = function (compound) {
	return compound.replace(/^(.+?)[\.\#][^\.\#]+$/, '$1')
}
// - things with same leaf selector minus pseudo-elements from right to left
const purgeCompoundPseudoElement = function (compound) {
	return compound.replace(lastInstanceRegex(/::[a-z\-]+/), '')
	
}
// have a function that purges something from a selector
// create a function gauntlet that can be run on a leaf
const purgeCompoundGauntlet = [purgeCompoundPseudoClass, purgeCompoundAttribute, purgeCompoundRelational, purgeCompoundCompounding, purgeCompoundPseudoElement]


var customFunctions = {
	// 'headings($from: 1, $to: 6)': function(from, to) {
	// 	var i, f = from.getValue(), t = to.getValue(),
	// 			list = new sass.types.List(t - f + 1);

	// 	for (i = f; i <= t; i++) {
	// 		list.setValue(i - f, new sass.types.String('h' + i));
	// 	}

	// 	return list;
	// },
	'sanify-selector($selector)': function (selector) {
		selector = selector.getValue()

		selector = selector.replace(/ ([\>\+\~]) /g, '$1')

		// remove whitespace around attribute equalities
		selector = selector.replace(/ *([\^\|\*\$\~]?\=) */g, '$1')

		// remove whitespace around attribute key value pairs
		selector = selector.replace(/(\[) *(\S*?) */g, '$1$2')
		selector = selector.replace(/ *(\S*?) *(\])/g, '$1$2')

		var selectorArray = selector.split(' ')
		// console.log(selectorArray)

		// sort the entire selector
		// pull out the pieces
		// - element
		// - id
		// - psuedo-elements
		// - classes
		// - attributes
		// - 

		// selector = selector.replace(/\b([a-z1-6]*)([^\#\s]*)(\#[\w\-]+)/g, '$1$3$2')

		// // slice extra classes
		// selector = selector.replace(/\b([^\.\s]*)(\.[\w\-]+)([^\.\s]*)(\#[\w\-]+)/g, '$1$3$2')

		return new sass.types.String(selector)
	},
	'-ds-has-state-pseudo($selector)': function (selector) {
		selector = selector.getValue()
		if (/:(hover|active|focus|visited|link|enabled|disabled|checked)/.test(selector)) {
			return sass.types.Boolean.TRUE
		}
		return sass.types.Boolean.FALSE
	},
	'-ds-has-state-classes($selector)': function (selector) {
		selector = selector.getValue()
		if (/\.[\w\-]+[^\.\s]*\.[\w\-]+/.test(selector)) {
			return sass.types.Boolean.TRUE
		}
		return sass.types.Boolean.FALSE
	},
	'-ds-peel-selector($selector)': function (selector) {
		var ancestorsArray = selector.getValue().split(' ')

		if (ancestorsArray.length == 0) return sass.types.Null.NULL

		var oldLeaf = ancestorsArray.splice(-1, 1)[0]

		if (oldLeaf) {
			var newLeaf
			for (const purgeFunction of purgeCompoundGauntlet) {
				newLeaf = purgeFunction(oldLeaf)

				if (newLeaf != oldLeaf) {	
					ancestorsArray.push(newLeaf)
					return arrayToSassString(ancestorsArray)
				}
			}
		}
		
		return arrayToSassString(ancestorsArray);
	},
	// - things with same leaf selector minus pseudo-classes from right to left
	'-ds-purge-tree-pseudo-class($selector)': function (selector) {
		return rightLeftRemove(selector, purgeCompoundPseudoClass)
	},
	// - things with same leaf selector minus attributes from right to left
	'-ds-purge-tree-attribute($selector)': function (selector) {
		return rightLeftRemove(selector, purgeCompoundAttribute)
	},
	// - things with same leaf selector minus relational triggers from left to right in rightmost compound
	'-ds-purge-tree-relational($selector)': function (selector) {
		return rightLeftRemove(selector, purgeCompoundRelational)
	},
	// - things with same leaf selector minus compounding selectors from right to left (split compounding?)
	'-ds-purge-tree-compounding($selector)': function (selector) {
		return rightLeftRemove(selector, purgeCompoundCompounding)
	},
	// - things with same leaf selector minus pseudo-elements from right to left
	'-ds-purge-tree-pseudo-element($selector)': function (selector) {
		return rightLeftRemove(selector, purgeCompoundPseudoElement)
	},
	// - things with the exact same complete leaf selector, peeling root-most compounds from left to right
	'-ds-purge-tree-root-compound($selector)': function (selector) {
		var ancestorsArray = selector.getValue().split(' ')

		// if (ancestorsArray.length == 1) return selector

		ancestorsArray.splice(0, 1)

		var give = arrayToSassString(ancestorsArray)

		return give;
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
	// 'purge-selector($selector)': function (selector) {
	// 	selector = selector.getValue()

	// 	selector = selector.replace(/([\.#][\w\-]+)[\>\~\+]([\.#][\w\-]+)$/, '$2').trim()

	// 	return new sass.types.String(selector);
	// },
	// 'leafmost-selector($selector)': function (selector) {
	// 	selector = selector.getValue()
		
	// 	selector = selector.match(/[\.#][\w\-]+$/)[0]
	// 	console.log(selector)

	// 	return new sass.types.String(selector);
	// },
	// 'bubble-selector($selector)': function (selector) {
	// 	// first check for pseudos
	// 	var oldSelector = selector.getValue()
	// 	var newSelector

	// 	newSelector = oldSelector.replace(/\:{1,2}[a-z\-]+$/, '')

	// 	if (newSelector != oldSelector) return new sass.types.String(newSelector);
	// 	oldSelector = newSelector


	// 	// then check for compounded selectors
	// 	newSelector = oldSelector.replace(/[\.#][\w\-\>\~\+\.#]+?$/, '').trim()

	// 	if (newSelector != oldSelector) return new sass.types.String(newSelector);
	// 	oldSelector = newSelector


	// 	return new sass.types.String(newSelector);
	// }
};
customFunctions