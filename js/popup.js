document.getElementById('launch-btn').addEventListener('click', launch);
document.getElementById('websites-btn').addEventListener('click', showEditor);
document.getElementById('url-form').addEventListener('submit', addWebsite);

const urlGroup = document.getElementById('url-form-group');
const sitesGroup = document.getElementById('current-sites-group');

// add a website to local storage
function addWebsite(e) {
  const siteName = document.getElementById('siteName');
  const url = document.getElementById('url');
  let error = false;

  // test website name input
  if (siteName.value === '') {
    error = sendErrorMsg(
      "Please enter the website's name.",
      'alert-danger',
      siteName
    );
  }

  // test url input
  const regex = /^(https?:\/\/)?([a-z]+\.)?([a-zA-Z0-9\-])+\.[a-z]+/g;

  if (url.value === '' || url.value.search(regex) === -1) {
    error = sendErrorMsg('Please enter a valid url.', 'alert-danger', url);
  } else {
    url.value =
      url.value.split('//').length === 1 ? 'http://' + url.value : url.value;
  }

  // create website
  const website = {
    name: siteName.value,
    url: url.value
  };

  if (!error) {
    /***************/

    chrome.storage.sync.get(['websites'], res => {
      if (res.websites === undefined) {
        const websites = [];
        websites.push(website);

        // initialize local storage
        chrome.storage.sync.set({ websites: websites }, () => {
          siteName.value = '';
          url.value = '';
        });
      } else {
        // get websites from local storage
        const websites = res.websites;

        if (!containsWebsite(websites, website, siteName, url)) {
          websites.unshift(website);

          chrome.storage.sync.set({ websites: websites }, () => {});

          refreshDisplayedWebsites();

          siteName.value = '';
          url.value = '';
        }
      }
    });
    /***************/
  }
  e.preventDefault();
}

// check if website is in local storage
function containsWebsite(websites, website, siteName, url) {
  let hasWebsite = false;

  // check if website exists in websites
  for (const site of websites) {
    if (site.name === website.name || site.url === website.url) {
      if (site.name === website.name) {
        hasWebsite = sendErrorMsg(
          'Website name already exists.',
          'alert-warning',
          siteName
        );
      }
      if (site.url === website.url) {
        hasWebsite = sendErrorMsg('Url already exists.', 'alert-warning', url);
      }
    }
  }
  return hasWebsite;
}

// show user error message
function sendErrorMsg(message, bootstrapClassName, element) {
  // create alert div
  const div = document.createElement('div');
  div.className = `alert ${bootstrapClassName}`;
  div.appendChild(document.createTextNode(message));

  const parentElement = element.parentElement;
  parentElement.insertBefore(div, element);

  setTimeout(() => document.querySelector('.alert').remove(), 3500);

  return true;
}

// clear displayed websites
function refreshDisplayedWebsites() {
  document.getElementById('websitesResults').innerHTML = '';
  displayWebsites();
}

// display saved websites
function displayWebsites() {
  const websitesResults = document.getElementById('websitesResults');

  /***************/

  chrome.storage.sync.get(['websites'], res => {
    if (res.websites) {
      const websites = res.websites;

      websites.forEach(website => {
        // makes website domain the id
        const trashId = parseUrl(website.url);

        websitesResults.innerHTML += `
                    <div class="d-flex justify-content-between align-items-center bg-purp rounded m-4">
                        <h3 class="mt-4 mb-4 ml-3 text-white">${website.name}</h3>
                        <div class="d-flex align-items-center m-2">
                            <a class="btn bg-white text-purp font-weight-bold shadow border-bottom" target="_blank" href="${website.url}">VISIT</a>
                            <a id="${trashId}" class="btn trash-btn ml-1 fas fa-trash-alt text-white pointer"></a>
                        </div>
                    </div>
                `;
      });
      addTrashEvents();
    }
  });

  /***************/
}

// add click events on trash icon
function addTrashEvents() {
  chrome.storage.sync.get(['websites'], res => {
    const websites = res.websites;

    websites.forEach(website => {
      const trashId = parseUrl(website.url);

      document.getElementById(trashId).addEventListener('click', removeWebsite);
    });
  });
}

// remove selected website
function removeWebsite() {
  const domain = this.getAttribute('id');

  chrome.storage.sync.get(['websites'], res => {
    let websites = res.websites;

    websites = websites.filter(website => parseUrl(website.url) !== domain);

    chrome.storage.sync.set({ websites: websites }, () => {});

    refreshDisplayedWebsites();
  });
}

// launch saved websites
function launch() {
  chrome.storage.sync.get(['websites'], res => {
    const websites = res.websites;
    websites.forEach(website => {
      try {
        chrome.tabs.create({
          url: website.url
        });
      } catch (e) {
        console.error(e);
      }
    });
  });
}

// display url editor
function showEditor() {
  const urlFormGroup = document.getElementById('url-form-group');
  const currentSitesGroup = document.getElementById('current-sites-group');
  const websitesResults = document.getElementById('websitesResults');

  shouldDisplay = false;
  if (urlFormGroup.className !== 'card-body') {
    urlFormGroup.className = 'card-body';

    currentSitesGroup.className = 'current-sites-rows row mt-3 text-center';

    websitesResults.innerHTML = '';

    shouldDisplay = true;
  } else {
    urlFormGroup.className = 'card-body hidden';

    currentSitesGroup.className =
      'current-sites-rows row mt-3 text-center hidden';

    shouldDisplay = false;
  }
  shouldDisplay ? displayWebsites() : null;
}

// parse domain from url
function parseUrl(url) {
  return url.split('.')[1];
}
