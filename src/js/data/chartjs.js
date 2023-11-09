import { faker } from '@faker-js/faker'

export const labels = ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'];
export const palette = ['rgba(255, 99, 132, 0.9)', 'rgba(54, 162, 235, 0.9)', 'rgba(255, 206, 86, 0.9)', 'rgba(75, 192, 192, 0.9)']

export default {
  pie: {
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
  },

  line: {
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
  },

  chart: {
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
  },

  bar: {
    labels: ['1', '2', '3', '4', '5', '6'],
    datasets: [
      {
        label: 'Female',
        data: [0.1878371750858264, 0.1648326945340512, 0.15083206258701848, 0.13280246596455175, 0.1721943048576214, 0.16182937554969215],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Male',
        data: [0.22377622377622378, 0.1528397565922921, 0.14314879308274286, 0.14859003548760477, 0.12449165905884305, 0.1418697708257548],
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  }
}
