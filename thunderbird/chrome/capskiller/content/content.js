(function()
	{
	//* Debug : Requiring console
	// replace "//* Debug" by "/* Debug" to comment each console logs
	var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
		.getService(Components.interfaces.nsIConsoleService);
	consoleService.logStringMessage('CapsKiller: Started'); //*/
	// Querying mime conversion interface
	var mimeConvert = Components.classes["@mozilla.org/messenger/mimeconverter;1"]
	     .getService(Components.interfaces.nsIMimeConverter);
	// function destroying the caps
	var capsKiller = function(string)
		{
		return string.replace(/([A-Z]{2}[A-Z]*)/g,function(match)
			{
			return match.toLowerCase()
			});
		}
	// subject filter
	var subjectFilter = function(encSubject)
		{
		var subject =  mimeConvert.decodeMimeHeader(encSubject, null, false, true);
		//* Debug
		consoleService.logStringMessage('CapsKiller: Converting "'+subject+'" to "'+capsKiller(subject)+'"');//*/
		return mimeConvert.encodeMimePartIIStr_UTF8(capsKiller(subject), false, "UTF-8", 0, 72);
		}
	// body filter
	var bodyFilter = function(aMessageHeader)
		{
		let messenger = Components.classes["@mozilla.org/messenger;1"]
			.createInstance(Components.interfaces.nsIMessenger);
		let listener = Components.classes["@mozilla.org/network/sync-stream-listener;1"]
			.createInstance(Components.interfaces.nsISyncStreamListener);
		let uri = aMessageHeader.folder.getUriForMsg(aMessageHeader);
			messenger.messageServiceFromURI(uri)
			.streamMessage(uri, listener, null, null, false, "");
		let folder = aMessageHeader.folder;
		var body = folder.getMsgTextFromStream(listener.inputStream,
			aMessageHeader.Charset,
			65536,
			32768,
			false,
			true,
			{ });
		//* Debug
		consoleService.logStringMessage('CapsKiller: Converting "'+uri+'" content.');
		consoleService.logStringMessage('CapsKiller: Content "'+body+'".');//*/
		}
	window.addEventListener('load', function()
		{
		// Localized strings
		var stringsObj = document.getElementById("capskiller-strings");
		// Creating a filter for exisiting messages
		var capsFilter =
			{
			id: "capskiller@elitwork.com#removecaps", // Adding a name
			name: stringsObj["name"], // Adding the name of the filter
			apply: function(aMsgHdrs, aActionValue, aListener, aType, aMsgWindow)
				{
				for (var i = 0; i < aMsgHdrs.length; i++)
					{
					var msgHdr = aMsgHdrs.queryElementAt(i, Components.interfaces.nsIMsgDBHdr);
					msgHdr.subject = subjectFilter(msgHdr.subject);
					}
				//* Debug
				consoleService.logStringMessage('CapsKiller: Filter applied');//*/
				},
			isValidForType: function(type, scope)
				{
				//* Debug
				consoleService.logStringMessage('CapsKiller: Filter validated. Type: '+type+'.');//*/
				return true;
				}, // all
			validateActionValue: function(value, folder, type)
				{
				//* Debug
				consoleService.logStringMessage('CapsKiller: dunno what it does');//*/
				return null;
				},
			allowDuplicates: true,
			needsBody: false,
			};
			//* Debug
			consoleService.logStringMessage('CapsKiller: Filter addition');//*/
			// add filter action to filter action list
			let filterService = Components.classes["@mozilla.org/messenger/services/filters;1"]
			.getService(Components.interfaces.nsIMsgFilterService);
			filterService.addCustomAction(capsFilter);
			//* Debug
			consoleService.logStringMessage('CapsKiller: Filter added');//*/
			// Listening for new mails
			var newMailListener =
				{
				msgAdded: function(msgHdr)
					{
					if(!msgHdr.isRead)
						{
						msgHdr.subject = subjectFilter(msgHdr.subject);
						bodyFilter(msgHdr);
						}
					//* Debug
					consoleService.logStringMessage('CapsKiller: Filter applied to new messages');//*/
					}
				}
			var notificationService =
			Components.classes["@mozilla.org/messenger/msgnotificationservice;1"]
				.getService(Components.interfaces.nsIMsgFolderNotificationService);
			notificationService.addListener(newMailListener, notificationService.msgAdded);
			//* Debug
			consoleService.logStringMessage('CapsKiller: New messages listener added');//*/
			},false);
	})();
