# Cloud Cup Main screen

This repository contains the source code of the main screen of the Cloud Cup game. 

It is a web application, built using AngularJS and relying on Firebase. It has been boostrapped using the [angular-seed](https://github.com/angular/angularfire-seed) project.

This is not an official Google product (experimental or otherwise), it is just code that happens to be owned by Google.

## How to run

### Install Dependencies

We have two kinds of dependencies in this project: tools and angular framework code.  The tools help
us manage and test the application.

* We get the tools we depend upon via `npm`, the [node package manager][npm].
* We get the angular code via `bower`, a [client-side code package manager][bower].

We have preconfigured `npm` to automatically run `bower` so we can simply do:

```
npm install
```

Behind the scenes this will also call `bower install`.  You should find that you have two new
folders in your project.

* `node_modules` - contains the npm packages for the tools we need
* `app/bower_components` - contains the angular framework files

*Note that the `bower_components` folder would normally be installed in the root folder but
angularfire-seed changes this location through the `.bowerrc` file.  Putting it in the app folder makes
it easier to serve the files by a webserver.*

### Configure the Application

 1. Open `app/js/config.js` and add your Firebase URL
 1. Go to your Firebase dashboard and enable email/password authentication under the Simple Login tab
 1. Copy/paste the contents of `config/security-rules.json` into your Security tab, which is also under your Firebase dashboard.

### Run the Application

We have preconfigured the project with a simple development web server.  The simplest way to start
this server is:

```
npm start
```

Now browse to the app at `http://localhost:8000/app/index.html`.


