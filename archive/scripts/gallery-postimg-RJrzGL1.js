// PostImg Gallery: RJrzGL1
// Host: PostImg (i.postimg.cc)
// Manual list - update when you change the PostImg gallery
// 16 laughing GIFs from https://postimg.cc/gallery/RJrzGL1
// Includes proper attribution links to respect PostImg terms

const GALLERY_IMAGES = [
    {
        src: 'https://i.postimg.cc/JGcDCrHD/animal-muppet-laughing.gif',
        link: 'https://postimg.cc/JGcDCrHD',
        alt: 'animal-muppet-laughing'
    },
    {
        src: 'https://i.postimg.cc/D8KJNJ03/baby.gif',
        link: 'https://postimg.cc/D8KJNJ03',
        alt: 'baby'
    },
    {
        src: 'https://i.postimg.cc/mPLcbv7d/crows-laughing.gif',
        link: 'https://postimg.cc/mPLcbv7d',
        alt: 'crows-laughing'
    },
    {
        src: 'https://i.postimg.cc/9DLDzLpc/dalai-lama.gif',
        link: 'https://postimg.cc/9DLDzLpc',
        alt: 'dalai-lama'
    },
    {
        src: 'https://i.postimg.cc/1gT4r42T/donald-laughing-3.gif',
        link: 'https://postimg.cc/1gT4r42T',
        alt: 'donald-laughing-3'
    },
    {
        src: 'https://i.postimg.cc/WDthZ0Wg/donald2.gif',
        link: 'https://postimg.cc/WDthZ0Wg',
        alt: 'donald2'
    },
    {
        src: 'https://i.postimg.cc/8J6cKNVC/horse-laughing.gif',
        link: 'https://postimg.cc/8J6cKNVC',
        alt: 'horse-laughing'
    },
    {
        src: 'https://i.postimg.cc/30jRh1N5/horses-laughing.gif',
        link: 'https://postimg.cc/30jRh1N5',
        alt: 'horses-laughing'
    },
    {
        src: 'https://i.postimg.cc/RJxF2yML/laughing-animals-07-ANIMATION.gif',
        link: 'https://postimg.cc/RJxF2yML',
        alt: 'laughing-animals-07-ANIMATION'
    },
    {
        src: 'https://i.postimg.cc/HjbjbY2Z/laughing-animals-12-ANIMATION.gif',
        link: 'https://postimg.cc/HjbjbY2Z',
        alt: 'laughing-animals-12-ANIMATION'
    },
    {
        src: 'https://i.postimg.cc/ZCZncGsT/laughing-seal1-ANIMATION.gif',
        link: 'https://postimg.cc/ZCZncGsT',
        alt: 'laughing-seal1-ANIMATION'
    },
    {
        src: 'https://i.postimg.cc/crmH5FPf/laughing-seal8-ANIMATION.gif',
        link: 'https://postimg.cc/crmH5FPf',
        alt: 'laughing-seal8-ANIMATION'
    },
    {
        src: 'https://i.postimg.cc/LJ8XdzMw/pikachu.gif',
        link: 'https://postimg.cc/LJ8XdzMw',
        alt: 'pikachu'
    },
    {
        src: 'https://i.postimg.cc/f33RyDyv/powers-laughing.gif',
        link: 'https://postimg.cc/f33RyDyv',
        alt: 'powers-laughing'
    },
    {
        src: 'https://i.postimg.cc/67D5GgGx/robots-laughing.gif',
        link: 'https://postimg.cc/67D5GgGx',
        alt: 'robots-laughing'
    },
    {
        src: 'https://i.postimg.cc/TKNPTpdw/spongebob.gif',
        link: 'https://postimg.cc/TKNPTpdw',
        alt: 'spongebob'
    }
];

// Simple gallery functions
function getRandomGalleryImage() {
    return GALLERY_IMAGES[Math.floor(Math.random() * GALLERY_IMAGES.length)];
}

function displayRandomGalleryImage(elementId) {
    const imgElement = document.getElementById(elementId);
    if (imgElement) {
        const randomImage = getRandomGalleryImage();
        
        // Create or find the link wrapper
        let linkElement = imgElement.parentElement;
        if (!linkElement || linkElement.tagName !== 'A') {
            // Create a new link wrapper
            linkElement = document.createElement('a');
            linkElement.target = '_blank';
            linkElement.style.display = 'block';
            
            // Insert the link before the image and wrap the image
            imgElement.parentNode.insertBefore(linkElement, imgElement);
            linkElement.appendChild(imgElement);
        }
        
        // Update both the link and the image
        linkElement.href = randomImage.link;
        imgElement.src = randomImage.src;
        imgElement.alt = randomImage.alt;
        
        console.log(`Gallery: Showing ${randomImage.alt} from ${GALLERY_IMAGES.length} total`);
    }
}

// Auto-load on page ready
document.addEventListener('DOMContentLoaded', function() {
    const galleryImage = document.getElementById('gallery-image');
    if (galleryImage) {
        displayRandomGalleryImage('gallery-image');
    }
});
