import React from 'react'
import PropTypes from 'prop-types'
import { PivotData } from '../js/Utilities'
import TableRenderers from '../renderers/TableRenderers'

/* eslint-disable react/prop-types */
// eslint can't see inherited propTypes!

class PivotTable extends React.PureComponent {
  render() {
    // console.log('PivotTable ', this.props)

    const Renderer = this.props.renderers[
      this.props.rendererName in this.props.renderers
        ? this.props.rendererName
        : Object.keys(this.props.renderers)[0]
    ]

    // console.log('Renderer ', Renderer)

    return <Renderer {...this.props} />
  }
}

PivotTable.propTypes = Object.assign({}, PivotData.propTypes, {
  rendererName: PropTypes.string,
  renderers: PropTypes.objectOf(PropTypes.func),
})

PivotTable.defaultProps = Object.assign({}, PivotData.defaultProps, {
  rendererName: 'Table',
  renderers: TableRenderers,
})

export default PivotTable
