app.controller
(
	'CanvasCtrl',
	[
		'$scope','$rootScope','$location','$modal','$routeParams','$base64','canvas','library','template','history','Project','ProjectService','CanvasService','DataService','DragService','HistoryService','FactoryService','navigation','utilities','ENV',
		function($scope,$rootScope,$location,$modal,$routeParams,$base64,canvas,library,template,history,Project,projectService,canvasService,dataService,dragService,historyService,FactoryService,navigation,utilities,ENV)
		{
			$scope.canvas = canvas;
			$scope.history = history;
			$scope.library = library;
			$scope.location = $location;
			$scope.DEBUG = ENV.DEBUG;
			
			$scope.dragService = dragService;
			$scope.historyService = historyService;
			
			$scope.messages = [];
			$scope.errors = [];
			
			//	handle component deletion
			$rootScope.$on
			(
				'deleteComponent',
				function()
				{
					if( !canvas.selection ) return;
		 			
					//	remove it
		 			utilities.remove(canvas.selection.instance);
		 			
		 			//	append to history
		 			historyService.save( "Removed " + canvas.selection.instance.componentId );
		 			
		 			//	nullify current selection (hides property inspector)
		 			canvas.selection = null;
				}
			);
			
			$rootScope.$on
			(
				'$locationChangeStart',
				function()
				{
					canvas.previewing = false;
				}
			);
			
			$scope.$watch
			(
				'canvas.currentProject',
				function(newVal,oldVal)
				{
					if( newVal != oldVal )
					{
						canvas.messages = [];
						canvas.errors = [];
						canvas.currentPage = null;
						canvas.previewing = false;
						
						//	init page specified in url (if set) when a project is selected
						if( newVal 
							&& $routeParams.pageId )
						{
							$scope.selectPageByIndex( $routeParams.pageId - 1 );
						}
						//	otherwise nullify the page
						else
						{
							canvas.currentPage = null;
						}
					}
				}
			);
			
			//	refresh page on history load
			$scope.$watch
			(
				'canvas.currentProject.content',
				function(newVal,oldVal)
				{
					if( newVal != oldVal )
					{
						if( newVal 
							&& $routeParams.pageId )
							$scope.selectPageByIndex( $routeParams.pageId - 1 );
						else
						{
							canvas.currentPage = null;
						}
					}
				}
			);
			
			//	give all elements of page tree a unique id when a new page is set
			//	(this prevents id collision when switching between projects)
			$scope.$watch
	 		(
	 			'canvas.currentPage',
	 			function(newVal,oldVal)
	 			{
	 				if( newVal != oldVal )
	 				{
	 					if( newVal && (!oldVal || newVal._id != oldVal._id) )
	 					{
	 						FactoryService.clear();
	 						FactoryService.id(canvas.currentPage);
	 					}
	 				}
	 			}
	 		);
			
			$scope.$watch
	 		(
	 			'canvas.currentPage',
	 			function(newVal,oldVal)
	 			{
	 				if( newVal != oldVal )
	 				{
	 					if( newVal )
	 					{
	 						if( oldVal && oldVal._id == newVal._id )
	 							canvas.dirty = true;
	 						else 
	 						{
	 							canvas.dirty = false;
	 						}
	 					}
	 					else
	 					{
	 						canvas.dirty = false;
	 						canvas.selection = null;
	 					}
	 				}
	 			},true
	 		);
			
			/**
			 * Initializes controller by loading sample data, components and (optionally) a project
			 */
			$scope.init = function(showEdit)
			{
				showEdit = showEdit || true;
				
				var initProject = function()
				{
					if( $routeParams.projectId )
					{
						Project.get
						(
							{
								projectId:$routeParams.projectId
							},
							function(response)
							{
								//	disallow editing projects logged-in user does not own
								if( response.creator._id != $rootScope.currentUser._id )
								{
									$location.path('/myprojects');
									
									return;
								}
								
								canvas.currentProject = response;
								
								//	init local history with saved actions
								if( canvas.currentProject.history )
								{
									var id = 0;
									var actions = JSON.parse( $base64.decode( canvas.currentProject.history ) );
									
									angular.forEach
									(
										actions,
										function(action)
										{
											action.id = id++;
										}
									);
									
									history.id = id + 1;
									history.actions = actions;
									history.currentAction = history.actions[ history.actions.length-1 ];
								}
							},
							function(response,err)
							{
								if( response.status == 403 )
								{
									$location.path( '/browse' );
								}
								
								if( response.status == 500 )
									$location.path( '/myprojects' );
							}
						);
					}
					else if( !canvas.currentProject )
					{
						$scope.newProject(showEdit);
					}
				};
				
				if( !library.sampleData )
					getSampleData();
				
				if( !library.components )
					canvasService.getElements().then( canvasService.getComponents ).then( canvasService.getTemplates ).then( initProject );
				else 
					initProject();
			};
			
			var getSampleData = function()
			{
				return dataService.getSampleData().then
				(
					function(data)
					{
						var sampleData = {};
						
						angular.forEach
						(
							data.data,
							function(item)
							{
								var resourceTypeId = item.content.resourceType.toLowerCase();
								
								if( resourceTypeId == "patient" )
								{
									if( !sampleData[resourceTypeId] )
										sampleData[resourceTypeId] = [];
									
									sampleData[resourceTypeId].push( item );
								}
								else if( resourceTypeId == "bundle" )
								{
									if( !sampleData[resourceTypeId] )
										sampleData[resourceTypeId] = [];
									
									sampleData[resourceTypeId].push( item );
								}
							}
						);
						
						library.sampleData = sampleData;
					}
				);
			};
			
			$scope.saveProject = function(callback)
			{
				canvasService.saveProject(callback);
			};
			
			$scope.deleteProject = function(project)
			{
				navigation.showConfirm("Are you sure you want to Delete this Project?").then
				(
					function()
					{ 
						project.$remove
						(
							{
								projectId:project._id
							},
							function()
							{
								var index = $scope.projects.indexOf(project);
								$scope.projects.splice(index,1);
							}
						);
					},
					function()
					{
					}
				);
				
				return;
			};
			
			$scope.newProject = function(showEdit)
			{
				var project = angular.copy( template.document );
				project.name = "My Project";
				
				canvas.currentProject = new Project();
				canvas.currentProject.content = project;
				canvas.currentProject.sharing = "private";
				
				if(showEdit)
				{
					return projectService.editItemProperties(canvas.currentProject.content, showEdit).then
					(
						//	user has provided a name and/or clicked "save"
						function ()
						{
							projectService.addPage(canvas.currentProject,true).then
							(
								function()
								{
									$scope.saveProject();
								},
								function()
								{
									canvas.currentProject = null;
									
									$location.path('/myprojects');
								}
							);
						},
						//	user has clicked cancel
						function()
						{
							canvas.currentProject = null;
							
							$location.path('/myprojects');
						}
					);
				}
				else
				{
					return projectService.addPage(canvas.currentProject,showEdit);
				}
			};
			
			$scope.previewProject = function()
			{
				canvas.previewing = true;
				
				canvas.selection = null;
			};
			
			$scope.addPage = function(showEdit,showOnCreate)
			{
				if( canvas.dirty )
				{
					navigation.showConfirm("You have unsaved changes. Do you want to Save?").then
					(
						function()
						{
							$scope.saveProject();
							
							projectService.addPage(canvas.currentProject,showEdit).then
							(
								function()
								{
									$scope.saveProject();
									
									if( showOnCreate )
										$scope.selectPageByIndex( canvas.currentProject.content.children.length - 1 );
								}
							);
						},
						function()
						{
							projectService.addPage(canvas.currentProject,showEdit).then
							(
								function()
								{
									$scope.saveProject();
									
									if( showOnCreate )
										$scope.selectPageByIndex( canvas.currentProject.content.children.length - 1 );
								}
							);
						}
					);
					
					return;
				}
				
				projectService.addPage(canvas.currentProject,showEdit).then
				(
					function()
					{
						$scope.saveProject();
						
						if( showOnCreate )
							$scope.selectPageByIndex( canvas.currentProject.content.children.length - 1 );
					}
				);
			};
			
			$scope.deletePage = function(page,showConfirm)
			{
				projectService.deletePage(page,canvas.currentProject,showConfirm);
			};
			
			$scope.editPage = function(page)
			{
				projectService.editItemProperties(page,false,true,canvas.currentProject).then
				(
					function()
					{
						page.updated = Date.now();
						
						$scope.saveProject();
					}
				);
			};
			
			$scope.showPages = function()
			{
				if( canvas.dirty )
				{
					navigation.showConfirm("You have unsaved changes. Do you want to Save?").then
					(
						function()
						{
							$scope.saveProject();
							$scope.setLocation('/editor/'+canvas.currentProject._id);
						},
						function()
						{
							$scope.setLocation('/editor/'+canvas.currentProject._id);
						}
					);
				}
				else
				{
					$scope.setLocation('/editor/'+canvas.currentProject._id);
				}
			};
			
			$scope.selectPageByIndex = function(id)
			{
				if( canvas.currentProject.content.children[id] )
					canvas.currentPage = canvas.currentProject.content.children[id];
			};
			
			$scope.setTemplate = function(template)
			{
				if( !canvas.currentPage ) return;
				
				if( canvas.currentPage.children.length 
					&& canvas.currentPage.children[0].id == template.id )
				{
					canvas.errors = ['Template "' + template.name + '" already set for this page'];
					
					return;
				}
				
				var templateInstance = FactoryService.componentInstance(template,{},canvas.currentPage);
				templateInstance.values.isNew = true;
				templateInstance.properties = angular.copy( library.elementsIndexed[template.componentId].properties );
				
				if( canvas.currentPage.children.length )
				{
					navigation.showConfirm("Setting a template will overwrite the page's current contents. Proceed?").then
					(
						function()
						{
							canvas.currentPage.children = [ templateInstance ];
						},
						function()
						{
						}
					);
				}
				else
				{
					canvas.currentPage.children = [ templateInstance ];
				}
			};
			
			$scope.clearCanvas = function()
			{
				canvas.currentPage.children = [];
				
				//	append to history
	 			historyService.save( "Cleared canvas" );
			};
			
			$scope.componentFilter = function(item)
			{
				return !item.abstract;
			};
			
			if( ENV.DEBUG )
			{
				$scope.exportSelectionDefinition = function()
		 		{
		 			var props = {id:"mycomponent",name:"My Component"};
		 			var output = _.defaults(props,canvas.selection.instance);
		 			
		 			//TODO: strip root component's location property values (x,y)
		 			
		 			delete output['category'];
		 			delete output['pid'];
		 			
		 			var ModalCtrl = function($scope,$modalInstance,content)
		 			{
		 				$scope.content = content;
		 				
		 				$scope.close = function()
		 				{
		 					$modalInstance.dismiss('cancel');
		 				};
		 			};
		 			
		 			var modalInstance = $modal.open
		 			(
		 				{
		 					template: '<div class="modal-body"><p>The following JSON represents your selection:</p><pre class="pre-scrollable">{{content | json}}</pre></div><div class="modal-footer"><button class="btn btn-primary" ng-click="close()">OK</button></div>',
		 					controller: ModalCtrl,
		 					resolve: {
		 						content: function(){ return output; }
		 					}
		 				}
		 			);
		 		};
			}
		}
	 ]
);