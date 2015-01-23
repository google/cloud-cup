# Cloud Cup Main screen

This repository contains the source code of the main screen of the Cloud Cup game. 

It is a web application, built using AngularJS and relying on Firebase. It has been boostrapped using the [angular-seed](https://github.com/angular/angularfire-seed) project

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

## Directory Layout

    app/                  --> all of the files to be used in production
      css/                --> css files
        app.css           --> default stylesheet
      img/                --> image files
      index.html          --> app layout file (the main html template file of the app)
      index-async.html    --> just like index.html, but loads js files asynchronously
      js/                 --> javascript files
        app.js            --> application
        config.js         --> where you configure Firebase and auth options
        controllers.js    --> application controllers
        directives.js     --> application directives
        decorators.js     --> decorator functions
        filters.js        --> custom angular filters
        firebase.utils.js --> some DRY methods for interacting with Firebase and AngularFire
        routes.js         --> routing and route security for the app
        services.js       --> custom angular services
        simpleLogin.js    --> some DRY methods for interacting with `$firebaseSimpleLogin`
      partials/           --> angular view partials (partial html templates)
        account.html
        chat.html
        home.html
        login.html

    test/                   --> test config and source files
      protractor-conf.js    --> config file for running e2e tests with Protractor
      e2e/                  --> end-to-end specs
        scenarios.js
      karma.conf.js         --> config file for running unit tests with Karma
      unit/                 --> unit level specs/tests
        configSpec.js       --> specs for config
        controllersSpec.js  --> specs for controllers
        directivesSpec.js   --> specs for directives
        filtersSpec.js      --> specs for filters
        servicesSpec.js     --> specs for services



