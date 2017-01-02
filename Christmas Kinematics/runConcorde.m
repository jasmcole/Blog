% Call the concorde TSP solver on a set of (x, y) co-ordinates
% This uses the faster (?) integer-valued 2D distance metric, so make sure
% the magnitudes of the x/y co-ordinates are large

function inds = runConcorde(x, y)

Np = length(x);

tspstring = ['NAME: output' char(10) ...
    'COMMENT: TSP' char(10) ...
    'TYPE: TSP' char(10) ...
    'DIMENSION: ' num2str(Np) char(10) ...
    'EDGE_WEIGHT_TYPE: EUC_2D' char(10) ...
    'NODE_COORD_SECTION' char(10)];

for n = 1:Np
    tspstring = [tspstring num2str(n) ' ' num2str(x(n)) ' ' num2str(y(n)) char(10)];
end

tspstring = [tspstring 'EOF'];

fid = fopen('TSPinput.txt','wt');
fprintf(fid, tspstring);
fclose(fid);

system('/path/to/concorde TSPinput.txt')

fid = fopen('TSPinput.sol','r');
inds = fscanf(fid, '%i');
fclose(fid);

inds(1) = [];
inds = inds + 1;
inds = [inds; inds(1)];

end
