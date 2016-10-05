#Welcome to Formelo CLI v1 Ladies

###### This is the version one of this CLI. It might have issues. Kindly create a issue if you happen to find one before us. Also,

The "lite" version of Formelo is open while the Full API is open here.
Some API calls hat triger native functionalities (see the documentation) might (WILL) not work when previewing on the browser


### 1. Initialize a new applet
---------------------------------------

    php formelo init

Follow the wizard to can specify the name and description of your app.


### 2. Create a Page
---------------------------------------

    php formelo make:page <name_of_page>

Add an extra --root to make the page the root page. By default the fitst page is the root page

    php formelo make:page <name_of_page> --root


### 2. Create a Provider
---------------------------------------

    php formelo make:provider <name_of_provider>


### 3. Import an external JavaScript file
---------------------------------------

    php formelo import:js <http://externalscript.js>


### 4. Import an external CSS file
---------------------------------------

    php formelo import:css <http://externalscript.css>


### 5. Compile and run a local server
---------------------------------------

    php formelo prepare

Pass in an additional --port=<PORT> to specify a new port  [Not Active]

### 6. Deploy an app
---------------------------------------

    php formelo deploy

Follow the wizard, pass in your username and API key


[Not Active]

### 1. Pull an existing project
---------------------------------------

    php formelo pull <github link>


# TODO -  

1. Deploy preview to native devices. GenyMotion - Android and Xcode's Emulator.
2. Pull Existing config





