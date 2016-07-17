clear

R = 1;
Nb = 20;
Nmean = 5e3;
density = Nmean/R^2;
Nsamp = 100000;
Rsamp = 0.02;
xmax = 30;

[x, y] = Make2DPoissonPointDistribution(R, Nb, Nmean);
Nnearby = SamplePointsWithinRadius(x, y, Nsamp, R, Rsamp);

figure(1)
subplot(121)
plot(x,y, '.')
title('Poisson point distribution')
axis image xy
xlim([0 1])
ylim([0 1])

subplot(122)
[N,X] = hist(Nnearby, 0:xmax);
bar(X, N/sum(N))
h = gca;
xl = max([0 h.XLim(1)]):h.XLim(2);
Nt = (density*pi*Rsamp^2).^xl./factorial(xl).*exp(-(density*pi*Rsamp^2));
hold on
p = plot(xl, Nt, 'o');
p.Color = h.ColorOrder(2,:);
hold off
leg = legend('Simulated', 'Theory');
title(['Distribution of number of points within a distance ' num2str(Rsamp)])
xlabel('Number of points')
ylabel('Probability')
xlim([0 xmax])
print(gcf, 'PoissonPoints.png', '-r150', '-dpng')
 
%% Binomial process

x = rand(1, Nmean);
y = rand(1, Nmean);
p = pi*Rsamp.^2/R^2;

Nnearby = SamplePointsWithinRadius(x, y, Nsamp, R, Rsamp);

figure(1)
subplot(121)
plot(x,y, '.')
title('Binomial point distribution')
axis image xy
xlim([0 1])
ylim([0 1])

subplot(122)
[N,X] = hist(Nnearby, 0:xmax);
bar(X, N/sum(N))
h = gca;
xl = max([0 h.XLim(1)]):h.XLim(2);
Nt = binopdf(xl, Nmean, p);
hold on
p = plot(xl, Nt, 'o');
p.Color = h.ColorOrder(2,:);
hold off
leg = legend('Simulated', 'Theory');
title(['Distribution of number of points within a distance ' num2str(Rsamp)])
xlabel('Number of points')
ylabel('Probability')
xlim([0 xmax])
print(gcf, 'BinomialPoints.png', '-r150', '-dpng')


%% Binomial process - nearest point

R = 1;
Nmean = 1e3;
Nsamp = 10000;

for n = 1:Nsamp
    x = rand(1, Nmean);
    y = rand(1, Nmean);
    r2 = (x - 0.5).^2 + (y - 0.5).^2;
    rmin(n) = sqrt(min(r2));
end

rbins = linspace(0, 0.1, 100);
[N,X] = hist(rmin, rbins);
N = N/trapz(X, N);

bar(X,N)

Nt = 2*pi*rbins*Nmean.*(1 - pi*rbins.^2).^(Nmean - 1);
hold on
h = gca;
plot(rbins, Nt, 'o', 'Color', h.ColorOrder(2,:))
hold off

title(['Distribution of distance to nearest point'])
xlabel('Distance')
ylabel('Probability density')
xlim([0 0.1])
leg = legend('Simulated', 'Theory');
print(gcf, 'BinomialPointsNearest.png', '-r150', '-dpng')

%% Poisson process - nearest point

R = 1;
Nb = 10;
Rb = R/Nb;
Nmean = 1e4;
density = Nmean;
Abox = (R/Nb)^2;

Nsamp = 1000;

for is = 1:Nsamp
    x = [];
    y = [];
    
    [x, y] = Make2DPoissonPointDistribution(R, Nb, Nmean);
    
    r2 = (x - 0.5).^2 + (y - 0.5).^2;
    rmin(is) = sqrt(min(r2));
    if(~mod(is, 100))
        is
    end
end

rbins = linspace(0, 0.03, 50);
[N,X] = hist(rmin, rbins);
N = N/trapz(X, N);


bar(X,N)

Nt = 2*pi*Nmean*rbins.*exp(-Nmean*pi*rbins.^2);
hold on
h = gca;
plot(rbins, Nt, 'o', 'Color', h.ColorOrder(2,:))
hold off

title(['Distribution of distance to nearest point'])
xlabel('Distance')
ylabel('Probability density')
xlim([0 0.02])
leg = legend('Simulated', 'Theory');
print(gcf, 'PoissonPointsNearest.png', '-r150', '-dpng')


