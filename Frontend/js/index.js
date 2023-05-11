const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const depositForm = document.getElementById('deposit-form');
const signupDepositForm = document.getElementById('signup-deposit-form');
const editProfile = document.getElementById('edit-profile');
const submitButton = document.getElementById('signup-submit');
const nextButton = document.getElementById('signup-next');
const backButton = document.getElementById('signup-back');
const editProfileButton = document.getElementById('edit-profile-button');
const saveChangesButton = document.getElementById('save-changes-button');
const cancelButton = document.getElementById('cancel-button');
const profileInputFirst = document.getElementById('ep-first');
const profileTextFirst = document.getElementById('first-name-ac');
const profileInputLast = document.getElementById('ep-last');
const profilTextLast = document.getElementById('last-name-ac');
const profileInputToken = document.getElementById('ep-token');
const profileTextToken = document.getElementById('token-ac');
const bonus = document.getElementById('bonus1-btn');
const reset = document.getElementById('reset-btn');
profileTextFirst.style.display = 'block';
profilTextLast.style.display = 'block';
profileTextToken.style.display = 'block';
submitButton.style.display = 'none';
let signUpSlide = 1;
let user;
// Get the token from a cookie or local storage
const tokenCookie = document.cookie.split('; ').find(row => row.startsWith('token='));
const token = tokenCookie ? tokenCookie.split('=')[1] : undefined;
if (token) {
    // Include the token in the request headers
    const headers = { Authorization: `Bearer ${token}` };
    // Make a request to a protected API endpoint
    fetch('/api/protected', { headers })
        .then(response => {
            if (response.ok) {
                // The token is valid, so display some protected data
                return response.json();
            } else {
                // The token is invalid, so redirect to the login page
                window.location.href = '/';
            }
        })
        .then(data => {
            // Display the protected data to the user
            console.log(data);
            document.getElementById('casino-loggedin').style.display = 'flex';
            document.getElementById('casino-login').style.display = 'none';
            document.getElementById('casino-signup-hero').style.display = 'none';
            document.getElementById('balance').innerHTML = (data.user.mainBalance + data.user.bonusBalance) + '.00';
            document.getElementById('main-balance').innerHTML = data.user.mainBalance + '.00';
            document.getElementById('bonus-balance').innerHTML = data.user.bonusBalance + '.00';
            document.getElementById('username-ac').innerHTML = data.user.username;
            document.getElementById('first-name-ac').innerHTML = data.user.firstname;
            document.getElementById('last-name-ac').innerHTML = data.user.lastname;
            document.getElementById('token-ac').innerHTML = data.user.etoken;
            document.getElementById('w-node-_7ba9df2c-f240-9ba2-6940-8da9e3e7ad9f-ff1b0340').style.display = 'none'
            profileInputFirst.value = data.user.firstname;
            profileInputLast.value = data.user.lastname;
            profileInputToken.value = data.user.etoken;
            const balanceHistoryContainer = document.getElementById('balance-history');
            if (data.balanceHistory != 0) {
                document.getElementById('bh-none').style.display = 'none'
                // Sort the balance history entries by date in descending order
                // HOW TO sort data.balanceHistory by newest data and time found in data.balanceHistory[a].timestamp?

                data.balanceHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                // Create the balance history entries as bh-wrapper divs
                data.balanceHistory.forEach((entry) => {
                    const amountDiv = document.createElement('div');
                    if (entry.newAmount == 0) {
                        amountDiv.innerHTML = `<span class="green-plus" style="color: red !important;">-</span><span>$${entry.amount}.00</span>`;
                    } else {
                        amountDiv.innerHTML = `<span class="green-plus">+</span><span>$${entry.amount}.00</span>`;
                    }

                    const timestampDiv = document.createElement('div');
                    const date = new Date(entry.timestamp);
                    const formattedDate = `${(date.getUTCFullYear() + "").substr(2)}/${(date.getUTCMonth() + 1 + "").padStart(2, "0")}/${(date.getUTCDate() + "").padStart(2, "0")} ${(date.getUTCHours() + "").padStart(2, "0")}:${(date.getUTCMinutes() + "").padStart(2, "0")}:${(date.getUTCSeconds() + "").padStart(2, "0")}`;
                    console.log(formattedDate);
                    timestampDiv.textContent = `${formattedDate}`;
                    timestampDiv.classList.add('text-light');

                    const newAmountDiv = document.createElement('div');
                    newAmountDiv.textContent = `$${entry.newAmount.toFixed(2)}`;
                    newAmountDiv.classList.add('text-light', 'thick');

                    const wrapperDiv = document.createElement('div');
                    wrapperDiv.classList.add('bh-wrapper');
                    wrapperDiv.appendChild(amountDiv);
                    wrapperDiv.appendChild(timestampDiv);
                    wrapperDiv.appendChild(newAmountDiv);

                    balanceHistoryContainer.appendChild(wrapperDiv);
                });
            }

            if (data.invoices != 0) {
                document.getElementById('ds-none').style.display = 'none'
                data.invoices.sort((a, b) => new Date(b.time) - new Date(a.time));

                data.invoices.forEach((entry) => {
                    console.log(entry)
                    const paymentId = entry.paymentId;
                    const amount1 = entry.callback.ipn_body.amount1[0];
                    const status = entry.status;
                    const paymentUrl = entry.paymentUrl;
                    const expiryDate = new Date(entry.expires);

                    // Get the parent element
                    const container = document.querySelector(".ds-container");

                    // Create the div element
                    const div = document.createElement("div");
                    div.classList.add("ds-item");

                    // Create the image wrapper element
                    const imageWrapper = document.createElement("div");
                    imageWrapper.classList.add("ds-image-wrapper");
                    div.appendChild(imageWrapper);

                    // Create the image element
                    const image = document.createElement("img");
                    image.setAttribute("src", "images/icorepay-dark.svg");
                    image.setAttribute("loading", "lazy");
                    image.setAttribute("alt", "");
                    image.classList.add("ds-image");
                    imageWrapper.appendChild(image);

                    // Create the content element
                    const content = document.createElement("div");
                    content.classList.add("ds-content");
                    div.appendChild(content);

                    // Create the invoice ID element
                    const invoiceId = document.createElement("div");
                    invoiceId.classList.add("ds-invoice-text");
                    invoiceId.innerHTML = `Invoice ID: <span class="invoiceid">${paymentId}</span>`;
                    content.appendChild(invoiceId);

                    // Create the subcontent element
                    const subcontent = document.createElement("div");
                    subcontent.classList.add("ds-subcontent");
                    content.appendChild(subcontent);

                    // Create the amount element
                    const amount = document.createElement("div");
                    amount.classList.add("ds-subtext");
                    amount.innerHTML = `Amount: <span class="ds-med">${amount1}</span>`;
                    subcontent.appendChild(amount);

                    // Create the status element
                    const statusElement = document.createElement("div");
                    statusElement.classList.add("ds-subtext");
                    if (status === "open") {
                        statusElement.innerHTML = `Status: <span class="ds-red">Open</span>`;
                    } else if (new Date() > expiryDate) {
                        statusElement.innerHTML = `Status: <span class="ds-grey">Expired</span>`;
                    } else {
                        statusElement.innerHTML = `Status: <span class="ds-green">${status}</span>`;
                    }
                    subcontent.appendChild(statusElement);

                    // Create the expires element
                    const expires = document.createElement("div");
                    expires.classList.add("ds-subtext");
                    subcontent.appendChild(expires);

                    // Update the expires element based on the expiry date
                    const countdownInterval = setInterval(() => {
                        const now = new Date();
                        const diff = expiryDate.getTime() - now.getTime();

                        if (diff <= 0) {
                            expires.innerHTML = "Expired";
                            statusElement.innerHTML = `Status: <span class="ds-grey">Closed</span>`;
                            link.classList.add("inactive");
                            clearInterval(countdownInterval);
                        } else {
                            const mins = Math.floor(diff / 60000);
                            const secs = Math.floor((diff % 60000) / 1000);
                            expires.innerHTML = `Expires In: <span class="ds-med">${mins} Mins ${secs} Sec</span>`;
                        }
                    }, 1000);

                    // Create the link element
                    const link = document.createElement("a");
                    link.classList.add("btn-primary", "small", "w-button");
                    link.setAttribute("href", paymentUrl);
                    link.innerHTML = "Return To Payment";
                    if (new Date() > expiryDate) {
                        link.innerHTML = "Expired";
                        link.classList.add("inactive");
                    }
                    div.appendChild(link);
                    // Add the new div element to the container
                    container.appendChild(div);
                });
            }

        })
        .catch(error => {
            // Handle any errors that occur during the request
            console.error(error);
        });
} else {
    // The token is not present, so redirect to the login page
    //window.location.href = '/login';
    document.getElementById('casino-loggedin').style.display = 'none';
    document.getElementById('casino-login').style.display = 'flex';
    document.getElementById('casino-signup-hero').style.display = 'block';
}
nextButton.addEventListener('click', () => {
    signUpSlide++;
    if (signUpSlide === 2) {
        submitButton.style.display = 'block';
    }
})
backButton.addEventListener('click', () => {
    signUpSlide--;
    if (signUpSlide < 2) {
        submitButton.style.display = 'none';
    }
})
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const username = formData.get('username');
    const password = formData.get('password');
    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    if (response.ok) {
        const { token } = await response.json();
        // Store the token in a cookie or local storage
        document.cookie = `token=${token}; path=/`;
        // Redirect to the home page
        window.location.href = '/';
    } else {
        const { error } = await response.json();
        // Display an error message to the user
        const errorElement = document.querySelector('#login-error');
        errorElement.textContent = error;
    }
});
signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(signupForm);
    const userData = {};
    // Loop through the form elements and add them to the userData object
    for (let element of formData) {
        userData[element[0]] = element[1];
    }
    // Send the user data to the server
    const response = await fetch('/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    if (response.ok) {
        const { token } = await response.json();
        // Store the token in a cookie or local storage
        document.cookie = `token=${token}; path=/`;
        // Redirect to the home page
        window.location.href = '/';
    } else {
        const { error } = await response.json();
        // Display an error message to the user
        const errorElement = document.querySelector('#login-error');
        errorElement.textContent = error;
    }
});
depositForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    document.getElementById('deposit-button').defaultValue = 'Loading...'
    const formData = new FormData(depositForm)
    const data = {
        "amount": formData.get('amount'),
        "user": document.getElementById('username-ac').innerHTML,
        "token": document.getElementById('token-ac').innerHTML
    };
    const response = await fetch('/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
    });
    if (response.ok) {
        const { payURL } = await response.json();
        window.location.href = payURL;
    } else {
        const { error } = await response.json();
        // Display an error message to the user
        const errorElement = document.querySelector('#deposit-error');
        errorElement.textContent = error;
    }
});
bonus.addEventListener('click', async (event) => {
    document.getElementById('deposit-button').defaultValue = 'Loading...'
    const data = {
        "amount": 1,
        "user": document.getElementById('username-ac').innerHTML,
        "token": document.getElementById('token-ac').innerHTML
    };
    const response = await fetch('/deposit-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
    });
    if (response.ok) {
        const { payURL } = await response.json();
        window.location.href = payURL;
    } else {
        const { error } = await response.json();
        // Display an error message to the user
        const errorElement = document.querySelector('#deposit-error');
        errorElement.textContent = error;
    }
});
reset.addEventListener('click', async (event) => {
    const data = {
        "user": document.getElementById('username-ac').innerHTML,
        "token": document.getElementById('token-ac').innerHTML
    };
    const response = await fetch('/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
    });
    if (response.ok) {
        location.reload();
    } else {
        const { error } = await response.json();
        // Display an error message to the user
        const errorElement = document.querySelector('#deposit-error');
        errorElement.textContent = error;
    }
});
editProfile.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(editProfile)
    const data = {
        "etoken": formData.get('Merchant-Address'),
        "firstName": formData.get('First-Name'),
        "lastName": formData.get('Last-Name'),
        "user": document.getElementById('username-ac').innerHTML
    };
    // Send the user data to the server
    const response = await fetch('/editprofile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (response.ok) {
        const { message } = await response.json();
        console.log(message); // or display the message to the user
        editProfileButton.style.display = 'block';
        profileTextFirst.style.display = 'block';
        profilTextLast.style.display = 'block';
        profileTextToken.style.display = 'block';
        profileInputFirst.style.display = 'none';
        profileInputLast.style.display = 'none';
        profileInputToken.style.display = 'none';
        saveChangesButton.style.display = 'none';
        cancelButton.style.display = 'none';
        profileTextFirst.innerText = profileInputFirst.value
        profilTextLast.innerText = profileInputLast.value
        profileTextToken.innerText = profileInputToken.value
        document.getElementById('w-node-_7ba9df2c-f240-9ba2-6940-8da9e3e7ad9f-ff1b0340').style.display = 'none'

    } else {
        const { error } = await response.json();
    }
});
// Get the logout button element
const logoutButton = document.getElementById('logout');
// Add a click event listener to the button
logoutButton.addEventListener('click', function () {
    // Remove the "token" cookie
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    // Redirect the user to the login page
    window.location.href = '/';
});
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const successParam = urlParams.get('success');
if (successParam) {
    const messageDiv = document.getElementById('message');
    const messgaeText = document.getElementById('message-text');
    messageDiv.style.display = 'flex';
    messgaeText.innerHTML = `🎉 Congratulations! You have successfully deposited <strong>$${successParam}</strong> in your account.`;
    // Remove the "success" parameter from the URL
    const newUrl = window.location.href.replace(/\?success=.*$/, '');
    history.replaceState(null, '', newUrl);
}

const successBonusParam = urlParams.get('successbonus');
if (successBonusParam) {
    const messageDiv = document.getElementById('message');
    const messgaeText = document.getElementById('message-text');
    messageDiv.style.display = 'flex';
    messgaeText.innerHTML = `🎉 Congratulations you have deposited $10! To say thank you for joing us we've given you a free $25 deposit bonus!<strong>$${successParam}</strong> in your account.`;
    // Remove the "success" parameter from the URL
    const newUrl = window.location.href.replace(/\?successbonus=*$/, '');
    history.replaceState(null, '', newUrl);
}

editProfileButton.addEventListener('click', () => {
    editProfileButton.style.display = 'none';
    profileTextFirst.style.display = 'none';
    profilTextLast.style.display = 'none';
    profileTextToken.style.display = 'none';
    profileInputFirst.style.display = 'block';
    profileInputLast.style.display = 'block';
    profileInputToken.style.display = 'block';
    saveChangesButton.style.display = 'block';
    cancelButton.style.display = 'block';
    document.getElementById('w-node-_7ba9df2c-f240-9ba2-6940-8da9e3e7ad9f-ff1b0340').style.display = 'block'
})
cancelButton.addEventListener('click', () => {
    editProfileButton.style.display = 'block';
    profileTextFirst.style.display = 'block';
    profilTextLast.style.display = 'block';
    profileTextToken.style.display = 'block';
    profileInputFirst.style.display = 'none';
    profileInputLast.style.display = 'none';
    profileInputToken.style.display = 'none';
    saveChangesButton.style.display = 'none';
    cancelButton.style.display = 'none';
    profileInputFirst.value = profileTextFirst.innerText
    profileInputLast.value = profilTextLast.innerText
    profileInputToken.value = profileTextToken.innerText
    document.getElementById('w-node-_7ba9df2c-f240-9ba2-6940-8da9e3e7ad9f-ff1b0340').style.display = 'none'
})

signupDepositForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(signupForm);
    const userData = {};
    // Loop through the form elements and add them to the userData object
    for (let element of formData) {
        userData[element[0]] = element[1];
    }
    // Send the user data to the server
    const response = await fetch('/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    if (response.ok) {
        const { token } = await response.json();
        // Store the token in a cookie or local storage
        document.cookie = `token=${token}; path=/`;
        // Redirect to the home page
        window.location.href = '/';
    } else {
        const { error } = await response.json();
        // Display an error message to the user
        const errorElement = document.querySelector('#login-error');
        errorElement.textContent = error;
    }
});