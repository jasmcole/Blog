function [x, y] = Make2DPoissonPointDistribution(R, Nb, N)

Rb = R/Nb;
density = N/R^2;
Abox = (R/Nb)^2;

x = [];
y = [];

for i = 1:Nb
    for j = 1:Nb
        n = poissrnd(density * Abox);
        x = [x (rand(1, n) + j-1)*Rb];
        y = [y (rand(1, n) + i-1)*Rb];
    end
end


end