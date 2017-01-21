// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by sass-descend.js.
import { name as packageName } from "meteor/sass-descend";

// Write your tests here!
// Here is an example.
Tinytest.add('sass-descend - example', function (test) {
  test.equal(packageName, "sass-descend");
});
