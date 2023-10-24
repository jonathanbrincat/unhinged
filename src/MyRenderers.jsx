import React from 'react'
import PropTypes from 'prop-types'
import { faker } from '@faker-js/faker'
import { PivotData } from './Utilities'

/* eslint-disable react/prop-types */
// eslint can't see inherited propTypes!

// ERROR in ./node_modules/chart.js/dist/chart.js Module parse failed: Unexpected token(567: 17). You may need an appropriate loader to handle this file type.
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale, LineElement, BarElement, PointElement, LineController, BarController } from 'chart.js';
import { Chart, Pie, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale, LineElement, BarElement, PointElement, LineController, BarController);

function makeRenderer(
  PlotlyComponent,
  traceOptions = {},
  layoutOptions = {},
  transpose = false,
  foobar = 'bar',
) {
  class Renderer extends React.PureComponent {
    render() {
      //
      const labels = ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'];
      const palette = ['rgba(255, 99, 132, 0.9)', 'rgba(54, 162, 235, 0.9)', 'rgba(255, 206, 86, 0.9)', 'rgba(75, 192, 192, 0.9)']

      const mockPieData = {
        labels,
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

      const mockLineData = {
        labels,
        datasets: [
          {
            label: 'Dataset 1',
            data: labels.map(() => faker.number.int({ min: -1000, max: 1000 })),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          },
          {
            label: 'Dataset 2',
            data: labels.map(() => faker.number.int({ min: -1000, max: 1000 })),
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
          },
        ],
      };

      const mockChartData = {
        labels,
        datasets: [
          {
            type: 'line',
            label: 'Dataset 1',
            data: labels.map(() => faker.number.int({ min: -1000, max: 1000 })),
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 2,
            fill: false,
          },
          {
            type: 'bar',
            label: 'Dataset 2',
            data: labels.map(() => faker.number.int({ min: -1000, max: 1000 })),
            backgroundColor: 'rgb(75, 192, 192)',
            borderColor: 'white',
            borderWidth: 2,
          },
        ],
      };

      console.log('testing ', labels.map(() => faker.number.int({ min: -1000, max: 1000 })))

      const mockBarData = {
        labels: ['1', '2', '3', '4', '5', '6'], // [0].x
        datasets: [
          {
            label: 'Female', // [0].name
            data: [0.1878371750858264, 0.1648326945340512, 0.15083206258701848, 0.13280246596455175, 0.1721943048576214, 0.16182937554969215], // [0].y
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          },
          {
            label: 'Male', // [1].name
            data: [0.22377622377622378, 0.1528397565922921, 0.14314879308274286, 0.14859003548760477, 0.12449165905884305, 0.1418697708257548],
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
          },
        ],
      };
      //


      const pivotData = new PivotData(this.props)
      const rowKeys = pivotData.getRowKeys()
      const colKeys = pivotData.getColKeys()
      console.log(JSON.stringify(rowKeys), ' :: ', JSON.stringify(colKeys))
      console.log(' => ', pivotData)
      
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

      // Compose data - START
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
          )
          values.push(isFinite(val) ? val : null)
          labels.push(datumKey.join('-') || ' ')
        }

        const trace = {name: traceKey.join('-') || fullAggName}
        if (traceOptions.type === 'pie') {
          trace.values = values
          trace.labels = labels.length > 1 ? labels : [fullAggName]
        }
        else {
          trace.x = transpose ? values : labels
          trace.y = transpose ? labels : values
        }

        return Object.assign(trace, traceOptions)
      })

      const dataNew = traceKeys.map((traceKey, i) => {
        console.log('yo >> ', traceKey)

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
          )
          values.push(isFinite(val) ? val : null)
          labels.push(datumKey.join('-') || ' ')
        }
        console.log('values => ', values)
        console.log('labels => ', labels)
        console.log('name => ', traceKey.join('-') || fullAggName)

        const trace = {
          label: traceKey.join('-') || fullAggName,
          data: transpose ? labels : values,
          backgroundColor: palette[i],
        }

        trace.labels = transpose ? values : labels

        return Object.assign(trace, traceOptions)
      })

      const dataFoo = {
        labels: dataNew[0].labels,
        datasets: [...dataNew],
      }
      
      console.log('data = ', dataFoo)
      // Compose data - END

      // Compose title - START
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

      console.log('titleText = ', titleText)
      // Compose title - END

      const layout = {
        title: titleText,
        /* eslint-disable no-magic-numbers */
        width: window.innerWidth / 1.5,
        height: window.innerHeight / 1.4 - 50,
        /* eslint-enable no-magic-numbers */
      }

      const options = {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: titleText,
          },
        },
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
        
        <>
          <p>Chart type = {foobar}</p>
          {
            foobar === 'bar' ? (
              <Bar data={dataFoo} options={options} />
            ) : (
              <Line data={dataFoo} options={options} />
            )
          }

          {/* <Chart type="bar" data={mockChartData} options={options} />
          <Pie data={mockPieData} options={options} /> */}

          {/* <h3>Chartjs Renderer</h3>
          <pre style={{ fontSize: '10px' }}>{JSON.stringify(dataFoo, null, 2)}</pre> */}
        </>
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
    'Chartjs Grouped Column Chart': makeRenderer(PlotlyComponent, {}, {}, null, 'bar'),

    'Chartjs Line Chart': makeRenderer(PlotlyComponent, {}, {}, null, 'line'),

    // 'Chartjs Pie Chart': makeRenderer(
    //   PlotlyComponent,
    //   {type: 'pie', scalegroup: 1, hoverinfo: 'label+value', textinfo: 'none'},
    //   {},
    //   true
    // ),

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
