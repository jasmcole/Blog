# The Travelling Artist Problem

Link to blog post: [https://jasmcole.com/2017/01/02/the-travelling-artist-problem/](https://jasmcole.com/2017/01/02/the-travelling-artist-problem/)

To use the concorde or LKH codes they need to be downloaded and compiled from here:

[http://www.math.uwaterloo.ca/tsp/concorde/downloads/downloads.htm](http://www.math.uwaterloo.ca/tsp/concorde/downloads/downloads.htm)

[http://webhotel4.ruc.dk/~keld/research/LKH/](http://webhotel4.ruc.dk/~keld/research/LKH/)

The simple functions in `runConcorde.m` and `runLKH.m` create a suitably formatted input file and call these executables. The resulting solution file is then `fscanf`'d back into an array of indices.

The stippling and TSP solving is done in `MakeImage.m`, which relies on the following File Exchange entries:

[Voronoi Limit](https://uk.mathworks.com/matlabcentral/fileexchange/34428-voronoilimit-varargin-)

[Pinky](https://uk.mathworks.com/matlabcentral/fileexchange/35797-generate-random-numbers-from-a-2d-discrete-distribution/content/pinky.m)

Finally, some .eps  files are also included in the repository of the faces in the blog post.
