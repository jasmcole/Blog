%% Parse data and plot

data = read_mixed_csv('UKCities.csv', ',');

Ncities = 300;

for n = 1:300
    names{n} = data{n,1};
    pops(n) = str2num(data{n,2});
    lats(n) = str2num(data{n,3});
    lons(n) = str2num(data{n,4});
end

clf
load('coordsUK.mat')
plot(coordsUK(:,1), coordsUK(:,2))
hold on
scatter(lons, lats, 5*sqrt(pops), log(pops), '.')
hold off

caxis([10.5 14])

xlabel('Longitude')
ylabel('Latitude')

% Run TSP

if(~exist('inds'))
    inds = runConcorde(lons*1000, lats*1000);
    inds = [inds; inds(1)];
end

hold on
p = plot(lons(inds), lats(inds));
p.Color = 'black';
hold off

%% Get total distance

R = 6371e3;
dist = 0;

for n = 1:length(inds)-1
    lon1 = lons(inds(n))*pi/180;
    lon2 = lons(inds(n+1))*pi/180;
    lat1 = lats(inds(n))*pi/180;
    lat2 = lats(inds(n+1))*pi/180;
    % Haversine formula
    d(n) = 2*R*asin(sqrt( sin(0.5*(lat2-lat1)).^2 + cos(lat1)*cos(lat2)*sin(0.5*(lon2-lon1)).^2  ));
    dist = dist + d(n);
end

% Assume 12 hours of night, UK population 64 million, world population 7.4
% billion
totaltime = 64.1e6/7.4e9 * 12*3600;
% Fraction of time spent travelling
fractiontravelling = 0.5;
avspeed = dist/(fractiontravelling*totaltime);


