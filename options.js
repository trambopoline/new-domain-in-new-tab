'use strict';

const KEY_EXCLUDE = "exclude",
      KEY_INCLUDE = "include",
      INCLUDE_OR_EXCLUDE_ALL = "include-all-or-exclude-all";


let radio_includeAll = document.getElementById( 'include-all' ),
    radio_excludeAll = document.getElementById( 'exclude-all' ),
    textarea_inclusionsList = document.getElementById( 'inclusions-list' ),
    textarea_exclusionsList = document.getElementById( 'exclusions-list' ),
    labelFor_inclusionsList = document.querySelectorAll('label[for="inclusions-list"]')[0],
    labelFor_exclusionsList = document.querySelectorAll('label[for="exclusions-list"]')[0];

// Listeners for days
radio_includeAll.addEventListener( 'change', listener_includeAll );
radio_excludeAll.addEventListener( 'change', listener_excludeAll );
document.addEventListener( 'DOMContentLoaded', reset_options );
document.getElementById( 'save' ).addEventListener( 'click', save_options );
document.getElementById( 'reset' ).addEventListener( 'click', reset_options );

// Validate and save settings. Display user-facing errors where appropriate.
function save_options()
{
  clearErrorMessages();

  console.debug( "SAVING" );
  // const REGEX_EMPTY_OR_WHITESPACE = /(^$|^\s+$)/,
  const REGEX_VALID_DOMAIN = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;

  let onPageExclusions = textarea_exclusionsList.value.split('\n'),
      onPageInclusions = textarea_inclusionsList.value.split('\n'),
      validExclusionDomains = [],
      validInclusionDomains = [],
      invalidExclusionDomains = '',
      invalidInclusionDomains = '',
      includeOrExcludeState;

  // Exclusion logic
  for( let exclusion in onPageExclusions )
  {
    // Grab the current exclusion and trim the whitespace off
    let currentExclusion = onPageExclusions[exclusion].trim();

    // Ignore empty strings
    if( currentExclusion === '' );
    // Collect valid exclusion domains to save
    else if( REGEX_VALID_DOMAIN.test( currentExclusion )  )
    {
      validExclusionDomains.push( currentExclusion );
    }
    // Collect invalid exclusion domains to display in error
    else
    {
      invalidExclusionDomains += '<li>' + currentExclusion + '</li>';
    }
  }
  // Display an error message if there's invalid exclusion domains
  if( invalidExclusionDomains !== '' )
  {
    document.querySelectorAll('#exclusion-domain-errors ul')[0].innerHTML = invalidExclusionDomains;
    let exclusionDomainErrors = document.getElementById('exclusion-domain-errors');
    exclusionDomainErrors.classList.remove( 'undisplayed' );
    setTimeout(function() // This allows the transition animation to play.
    {
      exclusionDomainErrors.classList.remove( 'hidden' );
    }, 0);
  }

  // Inclusion logic
  for( let inclusion in onPageInclusions )
  {
    // Grab the current inclusion and trim the whitespace off
    let currentInclusion = onPageInclusions[inclusion].trim();

    // Ignore empty strings and whitespace-only strings
    if( currentInclusion === '' );
    // Collect valid inclusion domains to save
    else if( REGEX_VALID_DOMAIN.test( currentInclusion )  )
    {
      validInclusionDomains.push( currentInclusion );
    }
    // Collect invalid inclusion domains to display in error
    else
    {
      invalidInclusionDomains += '<li>' + currentInclusion + '</li>';
    }
  }
  // Display an error message if there's invalid inclusion domains
  if( invalidInclusionDomains !== '' )
  {
    document.querySelectorAll('#inclusion-domain-errors ul')[0].innerHTML = invalidInclusionDomains;
        let inclusionDomainErrors = document.getElementById('inclusion-domain-errors');
    inclusionDomainErrors.classList.remove( 'undisplayed' );
    setTimeout(function() // This allows the transition animation to play.
    {
      inclusionDomainErrors.classList.remove( 'hidden' );
    }, 0);
    // document.getElementById('inclusion-domain-errors').style.display = 'block';
  }

  if( radio_includeAll.checked )
  {
    includeOrExcludeState = KEY_INCLUDE;
  }
  else if( radio_excludeAll.checked )
  {
    includeOrExcludeState = KEY_EXCLUDE;
  }
  else // default to 'include'
  {
    includeOrExcludeState = KEY_INCLUDE;
  }

  // Save valid settings to storage
  chrome.storage.sync.set(
      {
        'includeList': validInclusionDomains,
        'excludeList': validExclusionDomains,
        [INCLUDE_OR_EXCLUDE_ALL]: includeOrExcludeState
      }, handleErrors);
}

// Reset dom with settings saved in storage
function reset_options()
{
  clearErrorMessages();

  textarea_exclusionsList.value = "";
  textarea_inclusionsList.value = "";

  chrome.storage.sync.get( null, function( storageItems )
  {
      console.debug( storageItems );

      for( let storageItemKey in storageItems )
      {
        // Grab the value of the current storageItemKey
        let storageItemValue = storageItems[ storageItemKey ];

        if( storageItemKey === INCLUDE_OR_EXCLUDE_ALL )
        {
          if( storageItemValue === KEY_EXCLUDE )
          {
            radio_includeAll.checked = false;
            radio_excludeAll.checked = true;
            set_excludeAll();
          }
          else if( storageItemValue === KEY_INCLUDE )
          {
            radio_includeAll.checked = true;
            radio_excludeAll.checked = false;
            set_includeAll();
          }
        }
        else if( storageItemKey === "excludeList" )
        {
          // Move through the list of domains
          for( let domain in storageItemValue )
          {
            console.debug( "Exclude: ", storageItemValue[domain] );
            textarea_exclusionsList.value += storageItemValue[domain] + "\n";
          }
        }
        else if( storageItemKey === "includeList" )
        {
          for( let domain in storageItemValue )
          {
            // Move through the list of domains
            console.debug( "Include: ", storageItemValue[domain] );
            textarea_inclusionsList.value += storageItemValue[domain] + "\n";
          }
        }
      }
  } );
}

function listener_includeAll( event )
{
  if( event.target.checked === true )
  {
    set_includeAll();
  }
}

function listener_excludeAll( event )
{
  if( event.target.checked === true )
  {
    set_excludeAll();
  }
}

function set_includeAll()
{
  textarea_inclusionsList.disabled = true;
  textarea_exclusionsList.disabled = false;
  labelFor_exclusionsList.className = "";
  labelFor_inclusionsList.className = "disabled";
}

function set_excludeAll()
{
  textarea_inclusionsList.disabled = false;
  textarea_exclusionsList.disabled = true;
  labelFor_inclusionsList.className = "";
  labelFor_exclusionsList.className = "disabled";
}

function clearErrorMessages()
{
  let exclusionDomainErrors = document.getElementById('exclusion-domain-errors'),
      inclusionDomainErrors = document.getElementById('inclusion-domain-errors');

  // Get rid of any lingering error messages
  document.querySelectorAll('#exclusion-domain-errors ul')[0].innerHTML = '';
  exclusionDomainErrors.classList.add( 'hidden' );
  exclusionDomainErrors.classList.add( 'undisplayed' );
  document.querySelectorAll('#inclusion-domain-errors ul')[0].innerHTML = '';
  inclusionDomainErrors.classList.add( 'hidden' );
  inclusionDomainErrors.classList.add( 'undisplayed' );
}

function handleErrors()
{
  if( chrome.runtime.lastError )
  {
    console.error( chrome.runtime.lastError.message );
  }
}
