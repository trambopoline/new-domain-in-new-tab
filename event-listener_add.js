( function()
{
    // Construct a safe name to attach to the page window
    let functionName = "newTabOnClick_" + chrome.runtime.id;

    /**
     * Open anchor link in a new tab if it is an external domain and if it is
     * whitelisted
     *
     * @param event
     */
    window[ functionName ] = function( event )
    {
        let clickedElement = event.target;

        // Get the closest parent ( or self ) anchor element, if there is one
        let anchor = clickedElement.closest( 'a' );

        // If the anchor exists, process it
        if ( anchor )
        {

            // and if the clicked element links to an external domain...
            if( document.location.hostname !== anchor.hostname )
            {
                // then set target of new-domain anchor tags to "_blank".
                anchor.target = "_blank";
            }
        }
    }

    document.addEventListener( 'click', window[ functionName ], false );
})( window, document);

