app.service
(
	'CanvasService',
	[
	 '$rootScope','$base64','canvas',
	 function($rootScope,$base64,canvas)
	 {
		 $rootScope.$on
		 (
			'saveProject',
			function(event,args)
			{
				service.saveProject( args.length ? args[0] : null );
			}
		 );
		 
		 var service = 
		 {
			saveProject: function(callback)
			{
				 callback = callback || angular.noop;
				 
				 canvas.messages = [];
				 canvas.errors = [];
				
				 /**
				  * Saving the project causes an issue where property updates don't propagate to the underlying
				  * object, so we clone it instead
				  */
				 var __currentProject = angular.copy(canvas.currentProject);
				
				 if( __currentProject._isNew === false ) 
				 {
					__currentProject.$update
					(
						{
							projectId:__currentProject._id
						},
						function(response)
						{
							service.updateHash(false,true);
							
							canvas.messages.push( "Saved" );
							
							callback();
						},
						function(response)
						{
							if( response.data.errors )
								for(var f in response.data.errors )
									canvas.errors.push( response.data.errors[f].message );
						}
					);
				 }
				 else
				 {
					__currentProject.$save
					(
						function(response)
						{
							service.updateHash(false,true);
							
							callback();
						}
					);
				 }
			 },
			 
			 updateHash: function(update,updateSaved)
			 {
				 if( update )
					 canvas.hash.current = $base64.encode( JSON.stringify(canvas.currentProject) );
				
				 if( updateSaved )
					 canvas.hash.last = $base64.encode( JSON.stringify(canvas.currentProject) );
				
				 canvas.dirty = ((canvas.currentProject!=null && canvas.hash.current !== canvas.hash.last) || (canvas.currentPage!=null && canvas.hash.current !== canvas.hash.last) || (canvas.currentSection!=null && canvas.hash.current !== canvas.hash.last)) ? true : false;
			 }
		 };
		 
		 return service;
	 }
	]
);