// create and populate the ViewModel
function ViewModel() {
  var self = this;
  self.filterString = ko.observable('');
  self.locations = ko.observableArray([]);
  self.menuIsShowing = ko.observable(true);
  
  // initialize google map
  var map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 40.6572759, lng: -73.9510873},
    zoom: 14,
  });
  
  // handle hiding and displaying menu
  self.toggleMenu = function() {
    if (self.menuIsShowing()) {
      self.menuIsShowing(false);
      document.getElementById('map').style.left = '45px';
    }
    else {
      self.menuIsShowing(true);
      document.getElementById('map').style.left = '200px';
    }
  };
  
  // create the infoWindow
  var infoWindow = new google.maps.InfoWindow();
  
  // initialize the location markers --see locations.js
  for (var i = 0; i < neighborhoodLocations.length; i++) {
    self.locations.push(createMarker(neighborhoodLocations[i], i, infoWindow));
  }
  
  // handle list filtering using data-bind, while hiding/showing markers
  self.filteredLocations = ko.computed(function() {
    if (!self.filterString()) {
      self.locations().forEach(function(location) {
        location.setMap(map);
      });
      return self.locations();
    }
    else {
      return ko.utils.arrayFilter(self.locations(), function(location) {
        var name = location.title.toLowerCase();
        // see if the search string appears anywhere in the location name
        if (name.search(self.filterString().toLowerCase()) >= 0) {
          location.setMap(map);
          return true;
        }
        else {
          location.setMap(null);
          return false;
        }
      });
    }
  }, self);
}

// function for creating and storing markers
function createMarker(markerData, markerId, infoWindow) {
  var position = markerData.location;
  var name = markerData.name;
  // create a marker and put it in the locations
  var marker = new google.maps.Marker({
    position: position,
    title: name,
    animation: google.maps.Animation.DROP,
    id: markerId
  });
  // add click listener for the marker
  marker.addListener('click', function() {
    addMarkerAnimation(this);
    populateInfoWindow(this, infoWindow, map);
  });
  // add listener function for list item
  this.updateMarkerOnListClick = function() {
    addMarkerAnimation(this);
    populateInfoWindow(this, infoWindow, map);
    // do animation here
  };
  
  return marker;
}

function addMarkerAnimation(marker) {
  marker.setAnimation(google.maps.Animation.BOUNCE);
  setTimeout(function() {
    marker.setAnimation(null);
  }, 2100);
}

// populates the marker's infowindow for when it is clicked
function populateInfoWindow(marker, infoWindow, map) {
  // make sure infoWindow is not already open on this markers
  if (infoWindow.marker != marker) {
    // clear current content
    infoWindow.setContent('');
    infoWindow.marker = marker;
    // clear marker on close
    infoWindow.addListener('closeclick', function() {
      infoWindow.marker = null;
    });
    getWikipediaContent(marker, infoWindow);
    infoWindow.open(map, marker);
  }
}

// function using AJAX request with wikipedia APIs to find more info on location
function getWikipediaContent(marker, infoWindow) {
  var extract;
  $.ajax({
    type: 'GET',
    url: 'http://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exintro=&titles='
      + marker.title + '&callback=?',
    contentType: 'application/json; charset=utf-8',
    async: true,
    dataType: 'json',
    success: function (data, textStatus, jqXHR) {
      // on success, take out the extract and add to infoWindow
      if (data && data.query && data.query.pages) {
        extract = data.query.pages[Object.keys(data.query.pages)[0]].extract;
      }
      if (!extract) {
        extract = 'There does not seem to be a wiki page for ' + marker.title + '.'
      }
      var url = 'https://en.wikipedia.org/wiki/' +
        marker.title.replace(/ /g, '_');
      infoWindow.setContent('<div>' + marker.title + '</div></br>' +
        '<div>' + extract +
        '<p>Source: <a href=' + url + '>' + url +'</a></p></div>');
        console.log(extract);
    },
    error: function (errorInfo) {
      infoWindow.setContent('<div>' + marker.title + '</div></br>' +
        '<div>Error querying Wikipedia.</div>');
    }
  });
}

function handleGoogleMapError() {
  alert('Error loading Google Maps. Please try again.');
}

function initMap() {
  ko.applyBindings(new ViewModel());
}
