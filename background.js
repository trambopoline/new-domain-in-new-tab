'use strict';

// Making constants available to other scripts
const EXCLUDE_DOMAIN_ID = "newtab-disable",
	INCLUDE_DOMAIN_ID = "newtab-enable",
	KEY_EXCLUDE = "exclude",
	KEY_INCLUDE = "include",
	INCLUDE_OR_EXCLUDE_ALL = "include-all-or-exclude-all";
// 			CONTEXT_MENU_URL_PATTERN = ["http://*/*", "https://*/*"];

let CONTEXT_MENU_URL_PATTERN = [ "http://*/*", "https://*/*" ];

chrome.storage.sync.get( INCLUDE_OR_EXCLUDE_ALL, function( container_includeOrExcludeByDefault )
   {
      // If the value doesn't exist, or isn't an expected value, set it to a default value.
      let includeOrExcludeByDefault = ( container_includeOrExcludeByDefault[ INCLUDE_OR_EXCLUDE_ALL ] && ( container_includeOrExcludeByDefault[ INCLUDE_OR_EXCLUDE_ALL ] === KEY_EXCLUDE || container_includeOrExcludeByDefault[ INCLUDE_OR_EXCLUDE_ALL ] === KEY_INCLUDE ) ) ? container_includeOrExcludeByDefault[ INCLUDE_OR_EXCLUDE_ALL ] : KEY_INCLUDE; //default is 'include'
      // Attach the variable to the container
      container_includeOrExcludeByDefault[ INCLUDE_OR_EXCLUDE_ALL ] = includeOrExcludeByDefault;

       // Save valid settings to storage
  chrome.storage.sync.set(
      container_includeOrExcludeByDefault, handleSetError);
   });
// DEBUG STUFF
// chrome.storage.sync.clear();

// // let wildcardKey = 'include-all-or-exclude-all';
// let excludeList = [ 'www.google.com', 'www.example.com' ];
// let includeList = [ 'www.bing.com' ];
// let dummyValues = [
// {
// 	[ INCLUDE_OR_EXCLUDE_ALL ]: KEY_INCLUDE
// },
// {
// 	excludeList
// } ]; //, {includeList} ];

// dummyValues.forEach( function( arrayItem, index, array )
// {
// 	chrome.storage.sync.set( arrayItem );
// } );
// END DEBUG STUFF

// Add context menu actions
chrome.contextMenus.create(
{
	"title": "Disable for current domain",
	"id": EXCLUDE_DOMAIN_ID,
	"contexts": [ "browser_action" ],
	"enabled": false
		// 	"documentUrlPatterns": CONTEXT_MENU_URL_PATTERN
} );
chrome.contextMenus.create(
{
	"title": "Enable for current domain",
	"id": INCLUDE_DOMAIN_ID,
	"contexts": [ "browser_action" ],
	"enabled": false
		// 	"documentUrlPatterns": CONTEXT_MENU_URL_PATTERN
} );

// Listeners for browser action context menu
chrome.contextMenus.onClicked.addListener( function( info, targetTab )
{
	let currentTabDomain = getDomain( targetTab );
	let confirmDialogue = `Open New Domain in New Tab requires a page reload in order to completely reset links. Without a reload, new domain links that have already been visited will still open in a new tab ( though unvisited links should revert to their original behavior ).
					\nReload the page now?`;

	chrome.storage.sync.get( INCLUDE_OR_EXCLUDE_ALL, function( container_includeOrExcludeByDefault )
	{
		// If the value doesn't exist, or isn't an expected value, set it to a default value.
		let includeOrExcludeByDefault = ( container_includeOrExcludeByDefault[ INCLUDE_OR_EXCLUDE_ALL ] && ( container_includeOrExcludeByDefault[ INCLUDE_OR_EXCLUDE_ALL ] === KEY_EXCLUDE || container_includeOrExcludeByDefault[ INCLUDE_OR_EXCLUDE_ALL ] === KEY_INCLUDE ) ) ? container_includeOrExcludeByDefault[ INCLUDE_OR_EXCLUDE_ALL ] : KEY_INCLUDE;
		// Attach the variable to the container
		container_includeOrExcludeByDefault[ INCLUDE_OR_EXCLUDE_ALL ] = includeOrExcludeByDefault;

		if( info.menuItemId === EXCLUDE_DOMAIN_ID )
		{
			// If domains are being included by default
			if( includeOrExcludeByDefault === KEY_INCLUDE )
			{
				saveExcludedDomain( currentTabDomain );

				chrome.tabs.reload( targetTab.id );

				/*
				*	The below is commented out because the 'remove' script stopped working at some point.
				* 	Not sure where the breakage is, and it's easier to just reload the page for now.
				*/

				// Dismissable alert box informing user that this action will refresh the page
				// if( window.confirm( confirmDialogue ) )
				// {
				// 	chrome.tabs.reload( targetTab.id );
				// }
				// else
				// {
				// 	// Update the context menu items manually
				// 	setAsDisabledInContextMenu();

				// 	// Remove the event listener
				// 	chrome.tabs.executeScript( targetTab.id,
				// 	{
				// 		file: "event-listener_remove.js"
				// 	}, function( result )
				// 	{
				// 		handleTabError( result );
				// 	} );
				// }
			}
			else // Otherwise, domains are excluded by default
			{
				// Remove the domain from the list of included domains
				getListFromStorage( "includeList", function( includeList )
				{
					// 					console.dir("List: ", includeList );
					console.debug( "Before removal: ", includeList.currentTabDomain );

					let index = includeList.indexOf( currentTabDomain );
					if( index > -1 )
					{
						includeList.splice( index, 1 );
					}

					chrome.storage.sync.set(
					{
						"includeList": includeList
					}, function()
					{
						// If there was no issue in setting the list
						if( !handleSetError() )
						{
							// Dismissable alert box informing user that this action will refresh the page
							if( window.confirm( confirmDialogue ) )
							{
								chrome.tabs.reload( targetTab.id );
							}
							else
							{
								// Update the context menu items manually
								setAsDisabledInContextMenu();

								// Remove the event listener
								chrome.tabs.executeScript( targetTab.id,
								{
									file: "event-listener_remove.js"
								}, function( result )
								{
									handleTabError( result );
								} );
							}
						}
					} );
				} );
			}
		}
		else if( info.menuItemId === INCLUDE_DOMAIN_ID )
		{
			// If domains are being included by default
			if( includeOrExcludeByDefault === KEY_INCLUDE )
			{
				// Remove the domain from the list of excluded domains
				getListFromStorage( "excludeList", function( excludeList )
				{
					// 					console.dir("List: ", excludeList );
					console.debug( "Before removal: ", excludeList.currentTabDomain );

					let index = excludeList.indexOf( currentTabDomain );
					if( index > -1 )
					{
						excludeList.splice( index, 1 );
					}

					chrome.storage.sync.set(
					{
						"excludeList": excludeList
					}, function()
					{
						// If there was no issue in setting the list
						if( !handleSetError() )
						{
							implementNewTabLogic( targetTab );
						}
					} );
				} );
			}
			else // Otherwise, domains are excluded by default
			{
				saveIncludedDomain( currentTabDomain );
				implementNewTabLogic( targetTab );
			}
		}
	} );

} );


// Update the extension logic whenever a tab loads
chrome.tabs.onUpdated.addListener( function( tabId, changeInfo, currentTab )
{
	if( changeInfo.status === "loading" && isValidUrlType( currentTab ) )
	{
		console.debug( "Tab Loading" );
		fireLogicController( currentTab );
	}
} );

// Update the extension logic whenever the user switches to a tab
chrome.tabs.onActivated.addListener( function( activeInfo )
{
	// Disable the context menu items by default. They can be activated as needed.
	disableAllContextMenuItems();

	chrome.tabs.get( activeInfo.tabId, function callback( currentTab )
	{
		if( isValidUrlType( currentTab ) )
		{
			console.debug( "LOADING" );
			fireLogicController( currentTab );
		}
	} );
} );

// Fire the primary extension logic
function fireLogicController( targetTab )
{
	console.debug( "Primary logic firing!" );
	let domain = getDomain( targetTab );

	chrome.storage.sync.get( INCLUDE_OR_EXCLUDE_ALL, function( container_includeOrExcludeByDefault )
	{
		// If the value doesn't exist, or isn't an expected value, set it to a default value.
		let includeOrExcludeByDefault = ( container_includeOrExcludeByDefault[ INCLUDE_OR_EXCLUDE_ALL ] && ( container_includeOrExcludeByDefault[ INCLUDE_OR_EXCLUDE_ALL ] === KEY_EXCLUDE || container_includeOrExcludeByDefault[ INCLUDE_OR_EXCLUDE_ALL ] === KEY_INCLUDE ) ) ? container_includeOrExcludeByDefault[ INCLUDE_OR_EXCLUDE_ALL ] : KEY_INCLUDE;

		// Attach the variable to the container
		container_includeOrExcludeByDefault[ INCLUDE_OR_EXCLUDE_ALL ] = includeOrExcludeByDefault;

		// console.debug( includeOrExcludeByDefault );

		// If domains are being included by default
		if( includeOrExcludeByDefault === KEY_INCLUDE )
		{
			// Then see if the current domain is excluded.
			getListFromStorage( "excludeList", function( excludeList )
			{
				// If the current domain is not in the exclusions list
				if( excludeList.indexOf( domain ) === -1 )
				{
					// Then add the new tab logic
					implementNewTabLogic( targetTab );
				}
				else // If the current domain IS in the exclusions list
				{
					// Then set the context menu accordingly
					setAsDisabledInContextMenu();
				}
			} );
		}
		else // Otherwise, domains are excluded by default
		{
			// See if the current domain is included
			getListFromStorage( "includeList", function( includeList )
			{
				// If the current domain is not in the inclusions list
				if( includeList.indexOf( domain ) === -1 )
				{
					// Then set the context menu accordingly
					setAsDisabledInContextMenu();
				}
				else // If the current domain IS in the inclusions list
				{
					// Then add the new tab logic
					implementNewTabLogic( targetTab );
				}
			} );
		}
	} );
}

function getListFromStorage( listString, listFunction )
{
	chrome.storage.sync.get( listString, function( listContainer )
	{
		// Check whether we've got an array, and create one if we don't
		let list = ( listContainer[ listString ] && Array.isArray( listContainer[ listString ] ) ) ? listContainer[ listString ] : [];
		// Attach the variable to the container
		listContainer[ listString ] = list;

		// Execute callback logic
		listFunction( list );
	} );
}

// Set the context menu items to reflect the extension NOT being active for this tab
function setAsDisabledInContextMenu()
{
	console.debug( "Marking current tab as 'disabled'" );
	// disable the menu item to exclude this URL
	chrome.contextMenus.update( EXCLUDE_DOMAIN_ID,
	{
		"enabled": false
			// "documentUrlPatterns": CONTEXT_MENU_URL_PATTERN
	} );

	// enable the menu item to include this URL
	chrome.contextMenus.update( INCLUDE_DOMAIN_ID,
	{
		"enabled": true
			// "documentUrlPatterns": CONTEXT_MENU_URL_PATTERN
	}, function()
	{
		//     	console.debug(" SUCCESS ");
	} );

	// Switch the icon accordingly
	chrome.browserAction.setIcon({
	  path : {
      "16": "icons/icon_disabled16.png",
      "19": "icons/icon_disabled19.png",
      "32": "icons/icon_disabled32.png",
      "38": "icons/icon_disabled38.png",
      "48": "icons/icon_disabled48.png",
      "64": "icons/icon_disabled64.png",
      "128": "icons/icon_disabled128.png"
    }
	});
}

// Set the enable/disable context menu items to be completely inactive ( for non-http/https URLs )
function disableAllContextMenuItems()
{
	// disable the menu item to exclude this URL
	chrome.contextMenus.update( EXCLUDE_DOMAIN_ID,
	{
		"enabled": false
	} );

	// disable the menu item to include this URL
	chrome.contextMenus.update( INCLUDE_DOMAIN_ID,
	{
		"enabled": false
	} );

		// Switch the icon accordingly
	chrome.browserAction.setIcon({
	  path : {
      "16": "icons/icon_inactive16.png",
      "19": "icons/icon_inactive19.png",
      "32": "icons/icon_inactive32.png",
      "38": "icons/icon_inactive38.png",
      "48": "icons/icon_inactive48.png",
      "64": "icons/icon_inactive64.png",
      "128": "icons/icon_inactive128.png"
    }
	});
}

// Add the logic to open new domains in new tabs
function implementNewTabLogic( targetTab )
{
	console.debug( "Function 'implementNewTabLogic' : " );

	// Inject the script to open all links in new tabs
	chrome.tabs.executeScript( targetTab.id,
	{
		file: "event-listener_add.js"
	}, function( result )
	{
		handleTabError( result );
	} );

	// enable the menu item to exclude this URL
	chrome.contextMenus.update( EXCLUDE_DOMAIN_ID,
	{
		"enabled": true
			// 		"documentUrlPatterns": CONTEXT_MENU_URL_PATTERN
	} );

	// disable the menu item to include this URL
	chrome.contextMenus.update( INCLUDE_DOMAIN_ID,
	{
		"enabled": false
			// 		"documentUrlPatterns": CONTEXT_MENU_URL_PATTERN
	} );

	// chrome.pageAction.show( targetTab.id );

	chrome.browserAction.setIcon({
	  path : {
      "16": "icons/icon16.png",
      "19": "icons/icon19.png",
      "32": "icons/icon32.png",
      "38": "icons/icon38.png",
      "48": "icons/icon48.png",
      "64": "icons/icon64.png",
      "128": "icons/icon128.png"
    }
	});

}

function saveExcludedDomain( domain )
{
	getListFromStorage( "excludeList", function( excludeList )
	{
		excludeList.push( domain );
		chrome.storage.sync.set(
		{
			"excludeList": excludeList
		}, handleSetError() );
	} );
}

function saveIncludedDomain( domain )
{
	getListFromStorage( "includeList", function( includeList )
	{
		includeList.push( domain );
		chrome.storage.sync.set(
		{
			"includeList": includeList
		}, handleSetError() );
	} );
}

// Return whether the URL is valid or not
function isValidUrlType( targetTab )
{
	let protocol = getProtocol( targetTab );
	// 	console.debug( protocol );

	return( protocol === "http:" || protocol === "https:" ) ? true : false;
}

// Retrieve just the domain from a tab URL
function getDomain( targetTab )
{
	return targetTab.url.split( "/" )[ 2 ];
}

// Retrieve just the protocol from a tab URL
function getProtocol( targetTab )
{
	return targetTab.url.split( "/" )[ 0 ];
}

function handleTabError( result )
{
	if( !result )
	{
		console.error( chrome.runtime.lastError.message );
	}
}

function handleSetError()
{
	if( chrome.runtime.lastError )
	{
		return console.error( chrome.runtime.lastError.message );
	}
}
