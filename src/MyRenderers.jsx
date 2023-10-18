import React from 'react'
import PropTypes from 'prop-types'
import { PivotData } from './Utilities'

/* eslint-disable react/prop-types */
// eslint can't see inherited propTypes!

// ERROR in ./node_modules/chart.js/dist/chart.js Module parse failed: Unexpected token(567: 17). You may need an appropriate loader to handle this file type.
// import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
// import { Pie } from 'react-chartjs-2';

// ChartJS.register(ArcElement, Tooltip, Legend);

export const data = {
  labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
  datasets: [
    {
      label: '# of Votes',
      /* eslint-disable no-magic-numbers */
      data: [12, 19, 3, 5, 2, 3],
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
      ],
      borderWidth: 1,
    },
  ],
};

// export function App() {
//   return <Pie data={data} />;
// }


function makeRenderer(
  PlotlyComponent,
  traceOptions = {},
  layoutOptions = {},
  transpose = false
) {
  class Renderer extends React.PureComponent {
    render() {
      const pivotData = new PivotData(this.props)
      const rowKeys = pivotData.getRowKeys()
      const colKeys = pivotData.getColKeys()
      
      const traceKeys = transpose ? colKeys : rowKeys
      if (traceKeys.length === 0) {
        traceKeys.push([]);
      }

      const datumKeys = transpose ? rowKeys : colKeys
      if (datumKeys.length === 0) {
        datumKeys.push([]);
      }

      let fullAggName = this.props.aggregatorName;
      const numInputs = this.props.aggregators[fullAggName]([])().numInputs || 0
      if (numInputs !== 0) {
        fullAggName += ` of ${this.props.vals.slice(0, numInputs).join(', ')}`
      }

      const data = traceKeys.map(traceKey => {
        const values = []
        const labels = []
        for (const datumKey of datumKeys) {
          const val = parseFloat(
            pivotData
              .getAggregator(
                transpose ? datumKey : traceKey,
                transpose ? traceKey : datumKey
              )
              .value()
          );
          values.push(isFinite(val) ? val : null)
          labels.push(datumKey.join('-') || ' ')
        }

        const trace = {name: traceKey.join('-') || fullAggName}
        if (traceOptions.type === 'pie') {
          trace.values = values
          trace.labels = labels.length > 1 ? labels : [fullAggName]
        } else {
          trace.x = transpose ? values : labels
          trace.y = transpose ? labels : values
        }

        return Object.assign(trace, traceOptions)
      })

      let titleText = fullAggName
      const hAxisTitle = transpose
        ? this.props.rows.join('-')
        : this.props.cols.join('-')
      
      const groupByTitle = transpose
        ? this.props.cols.join('-')
        : this.props.rows.join('-')
      
      if (hAxisTitle !== '') {
        titleText += ` vs ${hAxisTitle}`
      }

      if (groupByTitle !== '') {
        titleText += ` by ${groupByTitle}`
      }

      const layout = {
        title: titleText,
        hovermode: 'closest',
        /* eslint-disable no-magic-numbers */
        width: window.innerWidth / 1.5,
        height: window.innerHeight / 1.4 - 50,
        /* eslint-enable no-magic-numbers */
      }

      if (traceOptions.type === 'pie') {
        const columns = Math.ceil(Math.sqrt(data.length))
        const rows = Math.ceil(data.length / columns);
        layout.grid = {columns, rows};
        data.forEach((d, i) => {
          d.domain = {
            row: Math.floor(i / columns),
            column: i - columns * Math.floor(i / columns),
          };
          if (data.length > 1) {
            d.title = d.name;
          }
        })

        if (data[0].labels.length === 1) {
          layout.showlegend = false;
        }
      } else {
        layout.xaxis = {
          title: transpose ? fullAggName : null,
          automargin: true,
        };
        layout.yaxis = {
          title: transpose ? null : fullAggName,
          automargin: true,
        };
      }

      return (
        // <Pie data={data} />
        <h1>Neverending shit. Just one problem after another.</h1>
      )

      // return (
      //   <div>
      //     <PlotlyComponent
      //       data={data}
      //       type=""
      //       layout={Object.assign(
      //         layout,
      //         layoutOptions,
      //         this.props.plotlyOptions
      //       )}
      //       config={this.props.plotlyConfig}
      //       onUpdate={this.props.onRendererUpdate}
      //     />

      //     <h3>Plotly Renderer</h3>
      //     <pre style={{ fontSize: '10px'}}>{JSON.stringify(data, null, 2)}</pre>
      //   </div>
      // )
    }
  }

  Renderer.defaultProps = Object.assign({}, PivotData.defaultProps, {
    plotlyOptions: {},
    plotlyConfig: {},
  })

  Renderer.propTypes = Object.assign({}, PivotData.propTypes, {
    plotlyOptions: PropTypes.object,
    plotlyConfig: PropTypes.object,
    onRendererUpdate: PropTypes.func,
  })

  return Renderer;
}

function makeScatterRenderer(PlotlyComponent) {
  class Renderer extends React.PureComponent {
    render() {
      const pivotData = new PivotData(this.props);
      const rowKeys = pivotData.getRowKeys();
      const colKeys = pivotData.getColKeys();
      if (rowKeys.length === 0) {
        rowKeys.push([]);
      }
      if (colKeys.length === 0) {
        colKeys.push([]);
      }

      const data = {x: [], y: [], text: [], type: 'scatter', mode: 'markers'};

      rowKeys.map(rowKey => {
        colKeys.map(colKey => {
          const v = pivotData.getAggregator(rowKey, colKey).value();
          if (v !== null) {
            data.x.push(colKey.join('-'));
            data.y.push(rowKey.join('-'));
            data.text.push(v);
          }
        });
      });

      const layout = {
        title: this.props.rows.join('-') + ' vs ' + this.props.cols.join('-'),
        hovermode: 'closest',
        /* eslint-disable no-magic-numbers */
        xaxis: {title: this.props.cols.join('-'), automargin: true},
        yaxis: {title: this.props.rows.join('-'), automargin: true},
        width: window.innerWidth / 1.5,
        height: window.innerHeight / 1.4 - 50,
        /* eslint-enable no-magic-numbers */
      };

      return (
        <PlotlyComponent
          data={[data]}
          layout={Object.assign(layout, this.props.plotlyOptions)}
          config={this.props.plotlyConfig}
          onUpdate={this.props.onRendererUpdate}
        />
      );
    }
  }

  Renderer.defaultProps = Object.assign({}, PivotData.defaultProps, {
    plotlyOptions: {},
    plotlyConfig: {},
  });
  Renderer.propTypes = Object.assign({}, PivotData.propTypes, {
    plotlyOptions: PropTypes.object,
    plotlyConfig: PropTypes.object,
    onRendererUpdate: PropTypes.func,
  });

  return Renderer;
}

export default function createMyRenderers(PlotlyComponent) {
  return {
    'Foobar': makeRenderer(
      PlotlyComponent,
      {type: 'pie', scalegroup: 1, hoverinfo: 'label+value', textinfo: 'none'},
      {},
      true
    ),

    // 'Grouped Column Chart': makeRenderer(
    //   PlotlyComponent,
    //   {type: 'bar'},
    //   {barmode: 'group'}
    // ),

    // 'Stacked Column Chart': makeRenderer(
    //   PlotlyComponent,
    //   {type: 'bar'},
    //   {barmode: 'relative'}
    // ),

    // 'Grouped Bar Chart': makeRenderer(
    //   PlotlyComponent,
    //   {type: 'bar', orientation: 'h'},
    //   {barmode: 'group'},
    //   true
    // ),

    // 'Stacked Bar Chart': makeRenderer(
    //   PlotlyComponent,
    //   {type: 'bar', orientation: 'h'},
    //   {barmode: 'relative'},
    //   true
    // ),

    // 'Line Chart': makeRenderer(PlotlyComponent),
    // 'Dot Chart': makeRenderer(PlotlyComponent, {mode: 'markers'}, {}, true),
    // 'Area Chart': makeRenderer(PlotlyComponent, {stackgroup: 1}),
    // 'Scatter Chart': makeScatterRenderer(PlotlyComponent),

    // 'Multiple Pie Chart': makeRenderer(
    //   PlotlyComponent,
    //   {type: 'pie', scalegroup: 1, hoverinfo: 'label+value', textinfo: 'none'},
    //   {},
    //   true
    // ),
  }
}
