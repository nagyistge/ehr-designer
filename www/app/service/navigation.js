/**
 * Service for navigation-related utilities
 * 
 * Also monitors location changes, and shows save confirm if navigating away from editor and 
 * document is unsaved.
 */
app.service
(
	'navigation',
	[
	 	'$rootScope','$modal','$location','canvas',
		function($rootScope,$modal,$location,canvas)
		{
	 		var navigation = 
	 		{
				showConfirm: function(message,title)
				{
					title = title || "Confirm";
					
					var ModalCtrl = function($scope,$modalInstance,message,title)
				    {
				    	$scope.message = message;
				    	$scope.title = title;
				    };
				     
				    var modalInstance = $modal.open
				    (
			    		 {
			    			 template: '<div class="modal-header"><button type="button" class="close" ng-click="$dismiss()" aria-hidden="true">&times;</button><h4 class="modal-title">Edit</h4></div><div class="modal-body">{{message}}</div><div class="modal-footer"><button type="button" class="btn btn-default" ng-click="$dismiss()">No</button><button type="button" class="btn btn-primary" ng-click="$close()">Yes</button></div>',
						     controller: ModalCtrl,
						     resolve: {
						    	 message: function(){ return message; },
						    	 title: function(){ return title; }
						     }
			    		 }
				    );
				    
					return modalInstance.result;
				}
			};
	 		
	 		$rootScope.$on
			(
				'$locationChangeStart',
				function(event)
				{
					var path = $location.path();
					
					if( path.indexOf("/editor") == -1 && $rootScope.currentUser)
					{
						if( canvas.dirty )
						{
							event.preventDefault();
							
							navigation.showConfirm("You have unsaved changes. Save before leaving?").then
							(
								function()
								{
									$rootScope.$emit
									(
										"saveProject",
										[
										 function()
										 {
											 canvas.dirty = false;
											 $location.path( path );
										 }
										]
									);
								},
								function()
								{
									canvas.dirty = false;
									$location.path( path );									
								}
							);
						}
						else
						{
							canvas.currentPage = null;
						}
					}
				}
			);
			
	 		
			return navigation;
		}
	 ]
);