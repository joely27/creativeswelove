document.addEventListener('DOMContentLoaded', function() {
  const parentDiv = document.getElementById('gridContainer'); // Get the parent div

  if (parentDiv) {
    const childDivs = parentDiv.querySelectorAll('.item'); // Get all child divs
    let imagesCount = 0; // Change variable name to imagesCount
    let allImagesLoaded = false;

    for (let i = 0; i < childDivs.length; i++) {
      const childDiv = childDivs[i];
      childDiv.style.marginBottom = '20px'; // Add a 20px bottom margin to each child div

      // Check if the child div contains an image
      const image = childDiv.querySelector('img');
      if (image) {
        image.addEventListener('load', function() {
          imagesCount++; // Change variable name to imagesCount

          // Check if all images have finished loading
          if (imagesCount === childDivs.length) { // Change variable name to imagesCount
            allImagesLoaded = true;
            initializeMasonry(); // Call the function after all images have loaded
          }
        });
      } else {
        imagesCount++; // Change variable name to imagesCount

        // Check if all images have finished loading
        if (imagesCount === childDivs.length) { // Change variable name to imagesCount
          allImagesLoaded = true;
          initializeMasonry(); // Call the function if there are no images to load
        }
      }
    }

    // Use the imagesLoaded library to detect when all images have finished loading
    imagesLoaded(parentDiv, function() { // Change function name to avoid conflicts
      if (!allImagesLoaded) {
        initializeMasonry(); // Call the function after all images have loaded (additional delay)
      }
    });
  }

  // Infinite Scroll functionality
  const loadMoreThreshold = 200; // Threshold in pixels from the bottom of the page to trigger loading more records
  let isLoadingMore = false; // Flag to prevent multiple simultaneous loading requests

  function handleScroll() {
    if (isLoadingMore) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const documentHeight = document.documentElement.offsetHeight;

    if (documentHeight - (scrollTop + windowHeight) <= loadMoreThreshold) {
      isLoadingMore = true;
      fetchData();
    }
  }

  window.addEventListener('scroll', handleScroll);

  function removeScrollListener() {
    window.removeEventListener('scroll', handleScroll);
  }

  function initializeMasonry() {
    setTimeout(function() {
      const gridContainer = document.getElementById("gridContainer");
      const masonry = new Masonry(gridContainer, {
        itemSelector: ".item",
        gutter: 30, // Set the desired gap between grid items
        percentPosition: true
      });

      // Show the grid and grid items
      gridContainer.style.visibility = "visible";
      const items = document.getElementsByClassName("item");
      for (let i = 0; i < items.length; i++) {
        items[i].style.opacity = "1";
      }
    }, 1000); // Delay Masonry initialization by 1 second
  }

  // Your Airtable configuration and data fetching code
  const base = "app1Z4C0dO7ufbxUS";
  const table = "tblGBDKi3iFTW5GT2";
  const apiKey = "patKNF8F1xv6adKyZ.7a5269c2c65164ef8233b6e7c3b3d9f977ae7e9e7c65182d87827db1ead9fa12";
  const desiredFields = "Work (copyright to their respective oweners),Name,Notes,Website,Category,Instagram";

  // Fetch Airtable schema to get fields information
  const metaUrl = `https://api.airtable.com/v0/meta/bases/${base}/tables`;
  const metaHeaders = { Authorization: `Bearer ${apiKey}` };

  fetch(metaUrl, { headers: metaHeaders })
    .then(response => response.json())
    .then(meta => {
      const tableMeta = meta.tables.find(t => t.id === table);

      if (!tableMeta) {
        throw new Error("Table not found in the schema.");
      }

      const fieldsSchema = {};
      tableMeta.fields.forEach(field => {
        fieldsSchema[field.name] = field.type;
      });

      // Split desired fields into an array
      const desiredFieldsArray = desiredFields.split(",").map(field => field.trim());

      // Fetch data from Airtable
      let offset = null; // Initialize offset to null
      const view = "viwZ36CXYDIDlsBBe";
      const pageSize = 12;

      function fetchData() {
        if (offset === '') {
          removeScrollListener();
          return;
        }

        let dataUrl = `https://api.airtable.com/v0/${base}/${table}?view=${view}&pageSize=${pageSize}`;
        if (offset) {
          dataUrl += `&offset=${offset}`;
        }
        const dataHeaders = { Authorization: `Bearer ${apiKey}` };

        fetch(dataUrl, { headers: dataHeaders })
          .then(response => response.json())
          .then(data => {
            const records = data.records;

            // Generate grid items using records data
            const gridContainer = document.getElementById("gridContainer");
            const recordsList = records.map(record => {
              const fields = desiredFieldsArray.map(field => {
                const fieldValue = record.fields[field];
                const fieldType = fieldsSchema[field];
                if (fieldType === "multipleAttachments") {
                  return fieldValue?.[0]?.thumbnails?.large?.url || "";
                }
                return fieldValue || "";
              });
              return fields;
            });

            recordsList.forEach(recordFields => {
              const item = document.createElement("div");
              item.className = "item";

              // Fetch and add image to the item div
              const imageSrc = recordFields[0];
              if (imageSrc !== "") {
                const img = document.createElement("img");
                img.src = imageSrc.trim();
                item.appendChild(img);
              }

              const cardBody = document.createElement("div");
              cardBody.className = "card-body";

              recordFields.slice(1).forEach((fieldValue, index) => {
                const fieldName = desiredFieldsArray[index + 1];
                const fieldType = fieldsSchema[fieldName];
                const fieldDiv = document.createElement("div");
                fieldDiv.id = `${fieldName}--${fieldType}`;

                if (fieldType === "multipleSelects" || fieldType === "singleSelect") {
                  let valuesArray = fieldValue;
                  if (typeof fieldValue === "string") {
                    valuesArray = fieldValue.split(",");
                  }

                  const listContainer = document.createElement("ul");
                  listContainer.className = "multipleSelects";

                  valuesArray.forEach(value => {
                    const listItem = document.createElement("li");
                    listItem.textContent = value.trim();
                    listContainer.appendChild(listItem);
                  });

                  fieldDiv.appendChild(listContainer);
                } else {
                  fieldDiv.textContent = fieldValue;
                }

                cardBody.appendChild(fieldDiv);

                // Add spacer div after each field
                if (index < desiredFieldsArray.length - 2) {
                  const spacerDiv = document.createElement("div");
                  spacerDiv.className = "spacer";
                  cardBody.appendChild(spacerDiv);
                }
              });

              item.appendChild(cardBody);
              gridContainer.appendChild(item);
            });

            // Initialize Masonry after the grid items are added to the DOM
            initializeMasonry();

            // Update the offset for the next page
            offset = data.offset;
            isLoadingMore = false; // Reset the loading flag

            // Check if there are more records to load
            if (offset) {
              handleScroll(); // Check if more records need to be loaded immediately
            } else {
              removeScrollListener(); // No more records to load, remove the scroll listener
            }
          })
          .catch(error => console.error(error.message));
      }

      fetchData(); // Fetch initial data
    })
    .catch(error => console.error(error.message));
});
