function SynchrotronExact(x,y,t,rad,saveFlag,prefix,clo,chi)

c = 299792458; 
tret = t;
tobs = t;
Ngrid = 200;
xplot = linspace(-rad, rad, Ngrid);
yplot = linspace(-rad, rad, Ngrid);
[xg, yg] = meshgrid(xplot,yplot);

for n = 1:200
    
    tcurr = tobs(n);
    [xpartcurr, ypartcurr, ~, ~, ~, ~] = GetParticleData(x, y, t, tcurr);
    
    for i = 1:Ngrid
        for j = 1:Ngrid
            xobs = xg(j,i);
            yobs = yg(j,i);
            
            %R is a vector over time
            R = sqrt((xobs - x).^2 + (yobs - y).^2);
            [~, ind] = min(abs(tret + R/c - tcurr)); 
            tretcurr = tret(ind);
            tretgrid(j,i) = tretcurr;
            
            [xpret, ypret, vxret, vyret, axret, ayret] = GetParticleData(x, y, t, tretcurr);
                        
            betaxret = vxret/c;
            betayret = vyret/c;
            
            gamma = 1/sqrt(1 - (betaxret^2 + betayret^2));
            
            R = sqrt((xobs - xpret)^2 + (yobs - ypret)^2);
            nxret = (xobs - xpret)/R;
            nyret = (yobs - ypret)/R;
            
            betaxdotret = axret/c;
            betaydotret = ayret/c;
            
            nminusbetaxret = nxret - betaxret;
            nminusbetayret = nyret - betayret;
            
            vectortermxret = nyret.*(nminusbetaxret.*betaydotret - nminusbetayret.*betaxdotret);
            vectortermyret = -nxret.*(nminusbetaxret.*betaydotret - nminusbetayret.*betaxdotret);
            
            betadotnret = betaxret.*nxret + betayret.*nyret;
            
            Ex(j,i) = nminusbetaxret./( gamma.^2.*(1-betadotnret).^3.*R.^2) + (1/c)*(vectortermxret./((1-betadotnret).^3.*R));
            Ey(j,i) = nminusbetayret./( gamma.^.2*(1-betadotnret).^3.*R.^2) + (1/c)*(vectortermyret./((1-betadotnret).^3.*R));
            Bz(j,i) = nxret.*Ey(j,i) - nyret.*Ex(j,i);
            Sx(j,i) = Ey(j,i).*Bz(j,i);
            Sy(j,i) = -Ex(j,i).*Bz(j,i);         
            
        end
    end
    
    Emag = sqrt(Ex.^2 + Ey.^2);
    Smag = sqrt(Sx.^2 + Sy.^2);
    
    clf
    subplot(221)
    imagesc(xplot, yplot, log(abs(Smag)))
    title('|S|')
    hold on
    scatter(xpartcurr, ypartcurr,100,'.','red')
    hold off
    axis image
    ticksOff
    caxis([clo chi])
      
    subplot(222)
    imagesc(xplot, yplot, log(abs(Ex)))
    title('E_x')
    hold on
    scatter(xpartcurr, ypartcurr,100,'.','red')
    hold off
    axis image
    ticksOff
    caxis([clo/2 chi/2])
    
    subplot(223)
    imagesc(xplot, yplot, tretgrid)
    title('t_{ret}')
    hold on
    scatter(xpartcurr, ypartcurr,100,'.','red')
    hold off
    axis image
    ticksOff
    
    subplot(224)
    imagesc(xplot, yplot, log(abs(Ey)))
    title('E_y')
    hold on
    scatter(xpartcurr, ypartcurr,100,'.','red')
    hold off
    axis image
    ticksOff
    caxis([clo/2 chi/2])
    
    drawnow
    
    set(gcf, 'PaperPositionMode', 'auto')
    if(saveFlag)
        print(gcf, [prefix '_' num2str(n) '.png'], '-dpng', '-r150')
    end
end

end

function [x, y, vx, vy, ax, ay] = GetParticleData(part_x, part_y, part_t, tcurr)

[~,tind] = min(abs(part_t - tcurr));

if (tind == length(part_t))
    x = part_x(end);
    y = part_y(end);
    vx = 0;
    vy = 0;
    ax = 0;
    ay = 0;
end

if (tind == 1)
    x = part_x(1);
    y = part_y(1);
    vx = 0;
    vy = 0;
    ax = 0;
    ay = 0;
end

if (tind > 1 && tind < length(part_t))
    x = part_x(tind);
    y = part_y(tind);
    
    vx = (part_x(tind+1) - part_x(tind))/(part_t(tind+1) - part_t(tind));
    vy = (part_y(tind+1) - part_y(tind))/(part_t(tind+1) - part_t(tind));
    
    ax = ((part_x(tind+1) - part_x(tind))/(part_t(tind+1) - part_t(tind)) - (part_x(tind) - part_x(tind-1))/(part_t(tind) - part_t(tind-1)))/(part_t(tind+1) - part_t(tind));
    ay = ((part_y(tind+1) - part_y(tind))/(part_t(tind+1) - part_t(tind)) - (part_y(tind) - part_y(tind-1))/(part_t(tind) - part_t(tind-1)))/(part_t(tind+1) - part_t(tind));       
end


end

