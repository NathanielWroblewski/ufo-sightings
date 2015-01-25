!function() {
  var ufoDatasetPath = '/ufo-sightings/public/datasets/ufo_sightings.csv'
    , usTopoJSONPath = '/ufo-sightings/public/datasets/us.json'
    , height = 400
    , width = 600

  var chloropleth = new Chloropleth({
    height: height,
    width: width,
    el: 'svg .map'
  })

  var ufo = new UFO({
    el: 'svg .ufo',
    beam: 'svg .ufo .beam',
    height: height,
    width: width
  })

  ufo.startAbducting()

  queue()
    .defer(d3.json, usTopoJSONPath)
    .defer(d3.csv, ufoDatasetPath, chloropleth.addDatum.bind(chloropleth))
    .await(chloropleth.render.bind(chloropleth));

  function Chloropleth(configuration) {
    this.width = configuration.width,
    this.height = configuration.height,
    this.el = configuration.el,
    this.dataset = [],
    this._hash = d3.map(),
    this.tooltip = d3.select('.tooltip-container'),

    this._setListeners = function() {
      d3.selectAll('.states path').on('mouseenter', this._showTooltip.bind(this))
      d3.selectAll('.states path').on('mousemove', this._moveTooltip.bind(this))
      d3.selectAll('.states path').on('mouseleave', this._hideTooltip.bind(this))
    },

    this._showTooltip = function(datum) {
      var count = event.target.dataset.count
        , state = this.titleize(datum.id)

      this.tooltip
        .style('visibility', 'visible')
        .select('.tooltip')
          .html(this._tooltipTemplate({ count: count, state: state }))
    },

    this._moveTooltip = function() {
      this.tooltip
        .style('top',  (event.pageY - 35) + 'px')
        .style('left', (event.pageX + 30) + 'px')
    },

    this._tooltipTemplate = function(attrs) {
      return(
        '<p>' +
          '<span class="state">' + attrs.state + '</span>' +
          attrs.count + ' sightings' +
        '</p>'
      )
    },

    this._hideTooltip = function() {
      this.tooltip.style('visibility', 'hidden')
    },

    this.titleize = function(title) {
      return title.replace(/-/, ' ').split(' ').map(function(word) {
        return word.charAt(0).toUpperCase() + word.slice(1)
      }).join(' ')
    },

    this._scale = function(value) {
      return (
        d3.scale
          .quantize()
          .domain(this._extent())
          .range(d3.range(9).map(function(i) {
            return "q" + i + "-9";
          }))(value)
      )
    },

    this._extent = function() {
      // var counts = this.dataset.map(function(datum) {
      //   return +datum.count
      // })
      // return d3.extent(counts)
      return [0,4000]
    },

    this._projection = d3.geo.albersUsa().scale(800).translate(
      [this.width / 2, this.height / 2]
    ),

    this._path = d3.geo.path().projection(this._projection),

    this.addDatum = function(datum) {
      this.dataset.push(datum)
      this._hash.set(datum.state.toLowerCase(), +datum.count);
    },

    this.render = function(error, us) {
      d3.select(this.el)
        .append('g')
          .attr('class', 'states')
          .selectAll('path')
            .data(topojson.feature(us, us.objects.states).features)
            .enter().append('path')
            .attr('class', function(d){
              return this._scale(this._hash.get(d.id))
            }.bind(this))
            .attr('data-count', function(d) {
              return this._hash.get(d.id)
            }.bind(this))
            .attr('d', this._path)
      this._setListeners()
    }
  }

  function UFO(configuration) {
    this.height = configuration.height,
    this.width  = configuration.width,
    this.el     = d3.select(configuration.el),
    this.beam   = this.el.select(configuration.beam),

    this.edge = function() {
      if (Math.random() < 0.5) {
        var x = 0
          , y = Math.floor(Math.random() * (1 + this.height))
      } else {
        var x = Math.floor(Math.random() * (1 + this.width))
          , y = 0
      }
      return [x,y].join(',')
    },

    this.interior = function() {
      var min  = 100
        , ymax = 250
        , xmax = 500
        , x = Math.floor(Math.random() * (xmax - min + 1) + min)
        , y = Math.floor(Math.random() * (ymax - min + 1) + min)

      return [x,y].join(',')
    },

    this.startAbducting = function() {
      this.el
        .attr('transform', 'translate(' + this.edge() + ')')
        .transition().delay(1500).duration(500).ease('cubic-out')
        .style('opacity', '1')
        .attr('transform', 'translate(' + this.interior() + ')')
        .each('end', this.beamUp.bind(this))
    },

    this.beamUp = function() {
      this.beam
        .transition().duration(1000).style('opacity', '1')
        .each('end', function() {
          this.beam
            .transition().duration(1000).style('opacity', '0')
            .each('end', this.escape.bind(this))
        }.bind(this))
    },

    this.escape = function() {
      this.el
        .transition().duration(500).ease('cubic-out')
        .style('opacity', '0')
        .attr('transform', 'translate(' + this.edge() + ')')
        .each('end', this.startAbducting.bind(this))
    }
  }

}()
