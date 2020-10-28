$(document).ready(function() {
    function scroll() {
        // scroll-to-top button
        if ($(window).scrollTop() >= 100) {
            $('#top-link-block').removeClass('d-none');
        } else {
            $('#top-link-block').addClass('d-none');
        }
    }

    document.onscroll = scroll;
    scroll();


    $('img.lightbox').each(function(i) {
        $(this).attr('data-w', $(this).get(0).naturalWidth);
        $(this).attr('data-h', $(this).get(0).naturalHeight);
    });

    var pswpElement = document.querySelectorAll('.pswp')[0];

    openGallery = function(pics, i, img) {
        var options = {
            index: i,
            getThumbBoundsFn: function(i) {
                var thumbnail = img;
                var pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
                var rect = thumbnail.getBoundingClientRect();
                return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
            }
        };
        return function() {
            var gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, pics, options);
            gallery.init();
            return false;
        };
    };

    $('article').each(function(i) {
        var pics = [];

        $(this).find('img.lightbox').each(function(k) {
            var link = $(this).attr('src');
            var w = $(this).attr('data-w');
            var h = $(this).attr('data-h');
            var title = $(this).attr('alt') || '';
            pics.push({
                src: link
                , w: w
                , h: h
                , title: title
            });
        });

        $(this).find('img.lightbox').each(function(k) {
            $(this).click(openGallery(pics, k, this));
	});
    });
});
