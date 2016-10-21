#Welcome to Formelo CLI v1 :)


###### This is the version one of this CLI. It might have issues. Kindly create a issue if you happen to find one before us.


### 1. Initialize a new applet
---------------------------------------

    php formelo init

Follow the wizard to can specify the name and description of your app.
You must specify thr following parameters:

1. Applet Name
2. Applet Description
3. Username
4. API_Key
5. Choose Applet Mode. Either Public or Private


### 2. Create a Page
---------------------------------------

    php formelo make:page <name_of_page>

Add an extra --root to make the page the root page. By default the fitst page is the root page

    php formelo make:page <name_of_page> --root

##### To Remove a page
Delete the page's generated folder and remove the entry in the /app/pages/pages.json. Pages are stored in the **pages** array


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


Pass in an additional --port=<PORT> to specify a new port


### 6. Deploy an app
---------------------------------------

    php formelo deploy


### 7. Publish your app to the app store
---------------------------------------

php formelo publish


### 8. Unpublish your app from the app store
---------------------------------------

php formelo publish








# TODO 


### 1. Pull an existing project
---------------------------------------

    php formelo pull <github_link>


### 2. Deploy preview to native devices. 
---------------------------------------

GenyMotion - Android and Xcode's Emulator.




