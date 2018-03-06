clf
clear
fs14

rpe = linspace(0,1,100);

for n = 1:length(rpe);
    I = MakeRollingImage(rpe(n), 'Grid');
    ticksOff
    title([num2str(rpe(n)) ' rotations per exposure'], 'FontSize', 8)
    colormap gray
    drawnow
    print(gcf,  ['Tire_' num2str(n) '.png'], '-dpng', '-r150')
end
%%
for n = 1:19
    fin = ['Tire_' num2str(n) '.png'];
    fout = ['Tire_' num2str(40-n) '.png'];
    copyfile(fin,fout);
end
    