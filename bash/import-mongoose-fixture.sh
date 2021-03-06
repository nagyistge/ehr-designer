#!/bin/bash

# imports json files located at lib/import/mongoose-fixture/ to their respective collections
# note that collections are emptied prior to import

mongoose-fixture --fixture='elements' --remove
mongoose-fixture --fixture='elements' --add

mongoose-fixture --fixture='components' --remove
mongoose-fixture --fixture='components' --add

mongoose-fixture --fixture='templates' --remove
mongoose-fixture --fixture='templates' --add

mongoose-fixture --fixture='export-types' --remove
mongoose-fixture --fixture='export-types' --add

mongoose-fixture --fixture='design-rules' --remove
mongoose-fixture --fixture='design-rules' --add