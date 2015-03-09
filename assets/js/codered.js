(function(window, document, undefined) {
  // Capitalises a string
  // Accepts:
  //   str: string
  // Returns:
  //   string
  var majusculeFirst = function(str) {
    return str.charAt(0).toUpperCase() + str.substring(1);
  };

  // Retrieves the value of a GET parameter with a given key
  // Accepts:
  //   param: string
  // Returns:
  //   string or null
  var getParam = function(param) {
    var queryString = window.location.search.substring(1),
    queries = queryString.split('&');
    for (var i in queries) {
      var pair = queries[i].split('=');
      if (pair[0] === param) {
        // Decode the parameter value, replacing %20 with a space etc.
        return decodeURI(pair[1]);
      }
    }
    return null;
  };

  // Filters posts with the condition `post['property'] == value`
  // Accepts:
  //   posts - array of post objects and a string
  //   property - string of post object property to compare
  //   value - filter value of property
  // Returns:
  //   array of post objects
  var filterPostsByPropertyValue = function(posts, property, value) {
    var values = value.split("+");
    var filteredPosts = [];
    // The last element is a null terminator
    posts.pop();
    for (var i in posts) {
      var post = posts[i],
      prop = post[property];

      // Last element of tags is null
      post.tags.pop();

      // The property could be a string, such as a post's category,
      // or an array, such as a post's tags
      if (prop.constructor === String) {
        if (prop.toLowerCase() === value.toLowerCase()) {
          filteredPosts.push(post);
        }
      } else if (prop.constructor === Array) {
        for (var j in prop) {
          for (var k in values) {
            var val = values[k];
            if (prop[j].toLowerCase() === val.toLowerCase()) {
              filteredPosts.push(post);
            }
          }
        }
      }
    }

    var uniquePosts = [];
    $.each(filteredPosts, function(i, el){
      if($.inArray(el, uniquePosts) === -1) uniquePosts.push(el);
    });

    return uniquePosts;
  };

  function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  }

  function replaceAll(string, find, replace) {
    return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
  }

  // Formats search results and appends them to the DOM
  // Accepts:
  //   property: string of object type we're displaying
  //   value: string of name of object we're displaying
  //   posts: array of post objects
  // Returns:
  //   undefined
  var layoutResultsPage = function(property, value, posts) {
    var $container = $('main');
    if ($container.length === 0) return;

    value = replaceAll(value, "+", " ");
    // Update the header
    $container.find('h2').text('Search results for ‘' + value + '’:'
  );

  // Loop through each post to format it
  $results = $container.find('ul.results');
  for (var i in posts) {
    var tagsList = '',
    post     = posts[i],
    tags     = post.tags;

    for (var j in tags) {
      tagsList += '<a href="/search.html?tags=' + tags[j] + '">' + tags[j] + '</a>\t'
    }

    $results.append(
      '<li class="result">'
      + '<div>'
      + '<a href="' + post.href + '"><h3>' + post.title +'</h3></a>'
      + '<p><b>' + post.summary + '</b></p>'
      + '<p>Tags: <i>' + tagsList + '</i></p>'
      + '<p>In: <a href="/search.html?category=' + post.category +'">' +  majusculeFirst(post.category) + '</a></p>'
      + '</div>'
      + '</li>'
    );
  }
};

// Formats the search results page for no results
// Accepts:
//   property: string of object type we're displaying
//   value: string of name of object we're displaying
// Returns:
//   undefined
var noResultsPage = function(property, value) {
  console.log("no results");
  $('main').find('h2').text('No Results Found.').after(
    '<p>We couldn\'t find anything associated with "' + value + '" here.  That '
    + 'doesn\'t mean we don\'t have it.  Try refining your search.<br><br><b>'
    + 'Can\'t find something?</b><br>Help us out... we can\'t write this whole '
    + 'site ourselves.  See <a href="/helpuswrite.html">this page.</a></p>'
  );
};

// Replaces ERB-style tags with Liquid ones as we can't escape them in posts
// Accepts:
//   elements: jQuery elements in which to replace tags
// Returns:
//   undefined
var replaceERBTags = function(elements) {
  elements.each(function() {
    // Only for text blocks at the moment as we'll strip highlighting otherwise
    var $this = $(this),
    txt   = $this.html();

    // Replace <%=  %>with {{ }}
    txt = txt.replace(new RegExp('&lt;%=(.+?)%&gt;', 'g'), '{{$1}}');
    // Replace <% %> with {% %}
    txt = txt.replace(new RegExp('&lt;%(.+?)%&gt;', 'g'), '{%$1%}');

    $this.html(txt);
  });
};

// Define the app object and expose it in the global scope
window.alxPrc = {
  getParam: getParam,
  filterPostsByPropertyValue: filterPostsByPropertyValue,
  noResultsPage: noResultsPage,
  layoutResultsPage: layoutResultsPage,
  replaceERBTags: replaceERBTags
};
})(window, window.document);

$(function() {
  var parameters = ['category', 'tags'];
  var map = {}
  //var index = 0;
  for (var idx in parameters) {
    map[parameters[idx]] = alxPrc.getParam(parameters[idx]);
  }
  $.each(map, function(type, value) {
    if (value !== null) {
      $.getJSON('/search.json', function(data) {
        posts = alxPrc.filterPostsByPropertyValue(data, type, value);
        if (posts.length === 0) {
          alxPrc.noResultsPage(type, value);
        } else {
          alxPrc.layoutResultsPage(type, value, posts);
        }
      });
    }
  });

  // Replace ERB-style Liquid tags in highlighted code blocks...
  alxPrc.replaceERBTags($('div.highlight').find('code.text'));
  // ... and in inline code
  alxPrc.replaceERBTags($('p code'));
});
