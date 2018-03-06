clear
clf
fs14

theta = linspace(0,pi,100);

R = 3;
offsets = linspace(0,2*pi/3,50);
vbyomega = 0.1;

for i = 1:length(offsets)
    clf
    for n = -10:10
        for m = 1:R
            theta = linspace(0,0.99*pi,100);
            r = vbyomega*(2*pi*(n + (m-1)/R) + offsets(i) - theta)./(sin(theta));
            
            theta(abs(r) > 1) = [];
            r(abs(r) > 1) = [];
            polar(theta,r)
            hold all
            hHidden = findall(gca,'type','text');
            delete(hHidden)
        end
    end
    drawnow
    print(gcf,  ['3blades_' num2str(i) '.png'], '-dpng', '-r150')
end