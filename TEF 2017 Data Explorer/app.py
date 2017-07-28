# -*- coding: utf-8 -*-
import dash
import dash_core_components as dcc
import dash_html_components as html
import plotly.graph_objs as go
import pandas as pd
import numpy as np
from scipy.stats import gaussian_kde as kde
import flask
import os

server = flask.Flask(__name__)
app = dash.Dash(name =__name__, server=server)
app.server.secret_key = os.environ.get('secret_key', 'secret')
app.title = 'TEF 2017 Data Explorer'

# From Vega 10 colourmap, default in matplotlib 2.0
linecolors = ["#1F77B4",
              "#ff7f0e",
              "#2ca02c",
              "#d62728",
              "#9467bd",
              "#8c564b",
              "#e377c2",
              "#7f7f7f",
              "#bcbd22",
              "#17becf"]

# Append an externally hosted CSS stylesheet
my_css_url = 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css'
app.css.append_css({"external_url": my_css_url})
my_css_url = 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css'
app.css.append_css({"external_url": my_css_url})

data = pd.read_csv('TEF_Y2_AllMetrics.csv')

inds = data.INDICATOR

toremove = ['DP', 'R', 'N', 'SUP', 'nan']
for t in toremove:
    data.INDICATOR[data.INDICATOR == t] = -1
data.INDICATOR = [float(i) for i in data.INDICATOR.values]

metrics = data.METRIC.unique()
modeofstudy = data.MODEOFSTUDY.unique()
providers = data.PROVIDER_NAME.unique()

app.layout = html.Div([
    html.Meta(name='viewport', content='width=device-width, initial-scale=1.0'),
    html.Div(
        html.Div(html.H1('TEF 2017 Data Explorer'), style={'padding-top':'10px'}, className='col-sm-12'),
        className='row'
    ),
    html.Div(
        html.Div(
            [html.P('The Teaching Excellence Framework (TEF) is a new scheme for recognising excellent teaching in the England higher education sector, and it provides information to help prospective students choose where to study.'),
            html.P('Participating higher education providers receive a gold, silver or bronze award reflecting their undergraduate teaching, learning environment and student outcomes.'),
            html.P('This app was built to help explore the most recent TEF 2017 data, to see where institutions in England stand against one another.'),
            html.P('To read more about the development of this webpage, see the blog post here:'),
            html.A('www.jasmcole.com', href='htp://www.jasmcole.com/XXX'),
            html.Br(), html.Br(),
            html.P('Read more about the TEF here:'),
            html.A('TEF 2017', href='http://www.hefce.ac.uk/lt/tef/'),
            html.Br(), html.Br(),
            html.P('and access the data here:'),
            html.A('Raw data in .csv format',
                href='http://www.hefce.ac.uk/media/HEFCE,2014/Content/Learning,and,teaching/TEF/TEFYearTwo/data/metrics/TEF_Y2_AllMetrics.csv'),
                html.Br(), html.Br(),
            html.P('More information on the data can be found here:'),
            html.A('TEF 2017 publication', href='http://www.hefce.ac.uk/media/HEFCE,2014/Content/Pubs/2016/201632/HEFCE2016_32.pdf')],
        className='col-sm-12'),
    className='row'),

    html.Hr(),

    html.H2('Look up Institution'),
    html.P('The metrics plotted below are:'),
    html.Ul([
        html.Li('The Teaching On My Course - responses from the National Student Survey (NSS).'),
        html.Li('Assessment And Feedback - NSS.'),
        html.Li('Academic Support - NSS.'),
        html.Li('Non-Continuation - data from HESA, a higher education statistics company.'),
        html.Li('Employment Or Further Study - data from the Destinations of Leavers from Higher Education Survey (DLHE).'),
        html.Li('Highly Skilled Employment Or Further Study - DLHE'),
    ]),
    html.P('Each of these metrics is given a numerical score for each institution.'),
    html.P('In the plots below, the shaded area represents a kernel density estimate of the probability density function of the metric indicated on the x-axis. The instutution selected here will be highlighted in the plots , and its TEF 2017 award indicated. Where available, the metric recorded for the selected institution is indicated by the vertical line. Optionally filter by the mode of study - Full Time, Part Time, or both.'),

    html.Div([
        html.Div([
            html.Div([
                html.Div([
                    html.Label('Institution'),
                    dcc.Dropdown(
                        id='provider',
                        options=[{'label': i, 'value': i} for i in providers],
                        value=providers[np.random.randint(0, len(providers))]
                    ),
                    ],
                    style={'padding': '10px'},
                    className='col-sm-6'
                ),
                html.Div([
                    html.Label('Mode of study'),
                    dcc.Dropdown(
                        id='modeofstudy',
                        options=[{'label': i, 'value': i} for i in modeofstudy],
                        value=modeofstudy[0],
                        multi=True
                    ),
                    ],
                    style={'padding': '10px'},
                    className='col-sm-6'
                )
                ],
                className='row'
            ),

            html.Div(
                html.Div(
                    html.H3('Waiting for ranking...',
                        id='header-ranking',
                        style={
                            'text-align': 'center',
                            'padding-bottom': '10px'
                              }
                    ),
                    className='col-sm-12'
                    ),
                className='row'
            )
            ],
            id = 'div-ranking',
            style={
                   'background-color': '#eeeeee',
                   'border-style': 'solid',
                   'border-width': '1px',
                   'border-color': '#dddddd',
                   'border-radius': '2px',
                   },
            className='col-sm-12'
        ),
        ],
        style={'margin': '0px'},
        className='row'
    ),


    html.Div([
        html.Div(dcc.Graph(id='kde-graphic-1'), className='col-sm-6'),
        html.Div(dcc.Graph(id='kde-graphic-2'), className='col-sm-6')
        ],
        className='row'
    ),

    html.Div([
        html.Div(dcc.Graph(id='kde-graphic-3'), className='col-sm-6'),
        html.Div(dcc.Graph(id='kde-graphic-4'), className='col-sm-6')
        ],
        className='row'
    ),

    html.Div([
        html.Div(dcc.Graph(id='kde-graphic-5'), className='col-sm-6'),
        html.Div(dcc.Graph(id='kde-graphic-6'), className='col-sm-6')
        ],
        className='row'
    ),


    html.H3('Compare Metrics'),
    html.P('To explore the correlation between different TEF metrics, here you can select two metrics to plot against one another. Each point corresponds to one institution (where a score is given for both metrics), and the institutions are coloured according to their TEF award - Gold, Silver, or Bronze. The active institution is highlighed as a larger marker.'),
    html.P('Hover over a point to see the institution name, metirc values, and TEF award.'),
    html.P('Click a point to set that institution as active in all of the plots.'),

    html.Div([
        html.Div([
            html.Label(' TEF metric (x-axis)'),
            dcc.Dropdown(
                id='metricx',
                options=[{'label': i, 'value': i} for i in metrics],
                value=metrics[0]
            )],
            style={'padding': '10px'},
            className='col-sm-6'
            ),

        html.Div([
            html.Label(' TEF metric (y-axis)'),
            dcc.Dropdown(
                id='metricy',
                options=[{'label': i, 'value': i} for i in metrics],
                value=metrics[1]
            )],
            style={'padding': '10px'},
            className='col-sm-6'
            ),
        ],
        style={
               'background-color': '#eeeeee',
               'border-style': 'solid',
               'border-width': '1px',
               'border-color': '#dddddd',
               'border-radius': '2px',
               'margin': '0px'
               },
        className='row'
    ),

    dcc.Graph(id='scatter-graphic'),

], style={'max-width': '960px',
          'margin': '0 auto'
          },
   className='container')

# Returns a figure for the KDEs
def make_kde_fig(metricinput, modeofstudyinput, providerinput):
    traces = []
    ymax = []

    if isinstance(modeofstudyinput, str):
        modeofstudyinput = [modeofstudyinput] # For when there is only one element

    for im, m in enumerate(modeofstudyinput):
        toplot = data.INDICATOR[(data.SPLIT_CATEGORY == 'Core') &
                                (data.MODEOFSTUDY == m) &
                                (data.METRIC == metricinput) &
                                (data.INDICATOR > 0)]
        thiskde = kde(toplot)
        x = np.linspace(0, 100, 100)
        y = thiskde(np.linspace(0, 100, 100))
        ymax.append(np.max(y))
        trace = go.Scatter(
            x=x,
            y=y,
            name=m + ' - all institutions',
            marker = dict(color = (linecolors[im])),
            fill='tozeroy',
        )

        traces.append(trace)

        try:
            toplot = data.INDICATOR[(data.SPLIT_CATEGORY == 'Core') &
                                    (data.MODEOFSTUDY == m) &
                                    (data.METRIC == metricinput) &
                                    (data.INDICATOR > 0) &
                                    (data.PROVIDER_NAME == providerinput)]

            trace = go.Scatter(
                x = [toplot.values[0], toplot.values[0]],
                y = [0, thiskde(toplot.values[0])[0]],
                name = m + ' - ' + providerinput,
                line = dict(color = (linecolors[im])),
                mode = 'lines'
            )

            traces.append(trace)
        except:
            print('Couldnt find category')

    fig = {
        'data': traces,
        'layout': go.Layout(
            xaxis={
                'title': metricinput,
                'type': 'linear',
                'linewidth': 1,
                'ticks': 'outside'
            },
            yaxis={
                'showticklabels': False,
                'range': [0, np.max(ymax)*1.1]
            },
            margin={'l':5, 'b': 40, 't': 10, 'r': 15},
            height=300,
            hovermode='closest',
            barmode='overlay',
            legend={
                'x': 0,
                'y': 1
            }
        )
    }

    return fig

########################
# Ranking text callbacks
########################

@app.callback(
    dash.dependencies.Output('header-ranking', 'children'),
    [dash.dependencies.Input('provider', 'value')]
    )
def update_header_ranking(providerinput):
    award = data.PROVIDER_TEFAWARD[(data.SPLIT_CATEGORY == 'Core') &
                                   (data.PROVIDER_NAME == providerinput)]
    return providerinput + ' was awarded ' + award.values[0]

@app.callback(
    dash.dependencies.Output('div-ranking', 'style'),
    [dash.dependencies.Input('provider', 'value')]
    )
def update_header_ranking(providerinput):
    award = data.PROVIDER_TEFAWARD[(data.SPLIT_CATEGORY == 'Core') &
                                   (data.PROVIDER_NAME == providerinput)]
    style = {
           'border-style': 'solid',
           'border-width': '1px',
           'border-color': '#222222',
           'border-radius': '4px'
           }

    if award.values[0] == 'Gold':
        style['background-color'] = 'rgba(217, 164, 65, 0.5)'
    if award.values[0] == 'Silver':
        style['background-color'] = 'rgba(168, 168, 168, 0.5)'
    if award.values[0] == 'Bronze':
        style['background-color'] = 'rgba(150, 90, 56, 0.5)'

    return  style

####################
# KDE plot callbacks
####################

@app.callback(
    dash.dependencies.Output('kde-graphic-1', 'figure'),
    [dash.dependencies.Input('modeofstudy', 'value'),
     dash.dependencies.Input('provider', 'value')]
    )
def update_kde_1(modeofstudyinput, providerinput):
    fig = make_kde_fig(metrics[0], modeofstudyinput, providerinput)
    return fig

@app.callback(
    dash.dependencies.Output('kde-graphic-2', 'figure'),
    [dash.dependencies.Input('modeofstudy', 'value'),
     dash.dependencies.Input('provider', 'value')]
    )
def update_kde_2(modeofstudyinput, providerinput):
    fig = make_kde_fig(metrics[1], modeofstudyinput, providerinput)
    fig['layout']['showlegend'] = False
    return fig

@app.callback(
    dash.dependencies.Output('kde-graphic-3', 'figure'),
    [dash.dependencies.Input('modeofstudy', 'value'),
     dash.dependencies.Input('provider', 'value')]
    )
def update_kde_3(modeofstudyinput, providerinput):
    fig = make_kde_fig(metrics[2], modeofstudyinput, providerinput)
    fig['layout']['showlegend'] = False
    return fig

@app.callback(
    dash.dependencies.Output('kde-graphic-4', 'figure'),
    [dash.dependencies.Input('modeofstudy', 'value'),
     dash.dependencies.Input('provider', 'value')]
    )
def update_kde_4(modeofstudyinput, providerinput):
    fig = make_kde_fig(metrics[3], modeofstudyinput, providerinput)
    fig['layout']['showlegend'] = False
    return fig

@app.callback(
    dash.dependencies.Output('kde-graphic-5', 'figure'),
    [dash.dependencies.Input('modeofstudy', 'value'),
     dash.dependencies.Input('provider', 'value')]
    )
def update_kde_5(modeofstudyinput, providerinput):
    fig = make_kde_fig(metrics[4], modeofstudyinput, providerinput)
    fig['layout']['showlegend'] = False
    return fig

@app.callback(
    dash.dependencies.Output('kde-graphic-6', 'figure'),
    [dash.dependencies.Input('modeofstudy', 'value'),
     dash.dependencies.Input('provider', 'value')]
    )
def update_kde_6(modeofstudyinput, providerinput):
    fig = make_kde_fig(metrics[5], modeofstudyinput, providerinput)
    fig['layout']['showlegend'] = False
    return fig

########################
# Scatter plot callbacks
########################

@app.callback(
    dash.dependencies.Output('scatter-graphic', 'figure'),
    [dash.dependencies.Input('metricx', 'value'),
     dash.dependencies.Input('metricy', 'value'),
     dash.dependencies.Input('modeofstudy', 'value'),
     dash.dependencies.Input('provider', 'value')]
    )
def update_scatter(metricxinput, metricyinput, modeofstudyinput, providerinput):

    traces = []
    layout = []

    if isinstance(modeofstudyinput, str):
        modeofstudyinput = [modeofstudyinput] # For when there is only one element

    for im, m in enumerate(modeofstudyinput):
        thisx = data.INDICATOR[(data.SPLIT_CATEGORY == 'Core') &
                            (data.MODEOFSTUDY == m) &
                            (data.METRIC == metricxinput) &
                            (data.INDICATOR > 0)]
        provx = data.PROVIDER_NAME[(data.SPLIT_CATEGORY == 'Core') &
                                   (data.MODEOFSTUDY == m) &
                                   (data.METRIC == metricxinput) &
                                   (data.INDICATOR > 0)]
        awardx = data.PROVIDER_TEFAWARD[(data.SPLIT_CATEGORY == 'Core') &
                                        (data.MODEOFSTUDY == m) &
                                        (data.METRIC == metricxinput) &
                                        (data.INDICATOR > 0)]

        thisy = data.INDICATOR[(data.SPLIT_CATEGORY == 'Core') &
                            (data.MODEOFSTUDY == m) &
                            (data.METRIC == metricyinput) &
                            (data.INDICATOR > 0)]
        provy = data.PROVIDER_NAME[(data.SPLIT_CATEGORY == 'Core') &
                                   (data.MODEOFSTUDY == m) &
                                   (data.METRIC == metricyinput) &
                                   (data.INDICATOR > 0)]

        # Not all institutions have metrics. Here we remove points which aren't
        # in both lists
        provnotiny = [p for p in provx.values if p not in provy.values]
        provnotinx = [p for p in provy.values if p not in provx.values]
        toremove = set(provnotinx + provnotiny)

        x  = [tx for (tx, px) in zip(thisx.values, provx.values) if px not in toremove]
        y  = [ty for (ty, py) in zip(thisy.values, provy.values) if py not in toremove]
        ax = [ax for (ax, px) in zip(awardx.values, provx.values) if px not in toremove]
        prov = [p for p in provx.values if p not in toremove]

        ax = np.array(ax)
        scores = np.zeros((len(ax), 1))
        scores[ax == 'Gold'] = 0
        scores[ax == 'Silver'] = 1
        scores[ax == 'Silver†'] = 1
        scores[ax == 'Bronze'] = 2
        scores = np.ravel(scores)

        # Gold, Silver, Bronze colours
        colorscale = [
            [0.0, 'rgb(217, 164, 65)'],
            [0.5, 'rgb(168, 168, 168)'],
            [1.0, 'rgb(150, 90, 56)']
        ]

        trace = go.Scatter(
            x=x,
            y=y,
            text = prov,
            customdata = prov,
            name=m,
            marker = {'color': scores, 'colorscale': colorscale},
            mode = 'markers',
            showlegend=False
        )

        traces.append(trace)

        try:
            x = data.INDICATOR[(data.SPLIT_CATEGORY == 'Core') &
                               (data.MODEOFSTUDY == m) &
                               (data.METRIC == metricxinput) &
                               (data.INDICATOR > 0) &
                               (data.PROVIDER_NAME == providerinput)]

            y = data.INDICATOR[(data.SPLIT_CATEGORY == 'Core') &
                               (data.MODEOFSTUDY == m) &
                               (data.METRIC == metricyinput) &
                               (data.INDICATOR > 0) &
                               (data.PROVIDER_NAME == providerinput)]

            trace = go.Scatter(
                x=x,
                y=y,
                name=providerinput + ' - ' + m,
                marker = {'color': linecolors[im], 'size':15},
                mode = 'markers'
            )

            traces.append(trace)
        except:
            print('Couldnt find category')


    return {
        'data': traces,
        'layout': go.Layout(
            xaxis={
                'title': metricxinput,
                'type': 'linear',
                'linewidth': 1,
                'ticks': 'outside'
            },
            yaxis={
                'title': metricyinput,
                'type': 'linear',
                'linewidth': 1,
                'ticks': 'outside'
            },
            margin={'l': 100, 'b': 40, 't': 10, 'r': 0},
            hovermode='closest',
            barmode='overlay',
            legend={
                'xanchor':'right',
                'yanchor':'bottom'
            }
        )
    }

@app.callback(
    dash.dependencies.Output('provider', 'value'),
    [dash.dependencies.Input('scatter-graphic', 'clickData')])
def return_click_data(clickData):
    print(clickData)
    if clickData is not None:
        return str(clickData['points'][0]['customdata'])
    else:
        return providers[np.random.randint(0, len(providers))]

# Remove if running the app in a hosted environment (like Heroku)
if __name__ == '__main__':
    app.server.run(debug=True, threaded=True)
