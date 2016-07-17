function Nnearby = SamplePointsWithinRadius(x, y, Nsamp, R, Rsamp)

for i = 1:Nsamp
    xs = rand * (R - 2*Rsamp) + Rsamp;
    ys = rand * (R - 2*Rsamp) + Rsamp;
    r2 = (x - xs).^2 + (y - ys).^2;
    Nnearby(i) = sum(r2 < Rsamp^2);
end