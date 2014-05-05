app.service
(
	'CanvasService',
	[
	 '$rootScope','$base64','$q','canvas','history','library','Component',
	 function($rootScope,$base64,$q,canvas,history,library,Component)
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
				 __currentProject.history = $base64.encode( JSON.stringify(history.actions) );
				 
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
							canvas.currentProject._isNew = false;
							
							service.updateHash(false,true);
							
							canvas.messages.push( "Saved" );
							
							callback();
						}
					);
				 }
			 },
			 
			 updateHash: function(update,updateSaved)
			 {
				 var content = canvas.currentProject ? angular.copy(canvas.currentProject) : null;
				 
				 if( update )
					 canvas.hash.current = $base64.encode( JSON.stringify(content) );
				
				 if( updateSaved )
					 canvas.hash.last = $base64.encode( JSON.stringify(content) );
				 
				 canvas.dirty = (canvas.currentProject!=null && canvas.hash.current !== canvas.hash.last) ? true : false;
			 },
			 
			 getComponents: function()
			 {
				 var async = $q.defer();
				
				 Component.get
				 (
					{},
					function(components)
					{
						var componentsIndexed = {};
						
						for(var c in components)
							componentsIndexed[ components[c].id ] = components[c];
						
						library.components = components;
						library.componentsIndexed = componentsIndexed;
						
						async.resolve();
						
						console.log( "components loaded", library.components, library.componentsIndexed );
					}
				);
				
				return async.promise;
			}
		 };
		 
		 return service;
	 }
	]
);