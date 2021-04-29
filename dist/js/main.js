import { debounce } from "./helpers.js";

const DEBOUNCE_TIME = 300;

const secondFrame = document.getElementById("second-frame");
const secondFrameWrapper = document.getElementById("second-frame-wrapper");
const cocktailInput = document.getElementById("cocktail-input");
const chalkBoardList = document.getElementById("chalk-board-list");
const chalkBoardHeader = document.getElementById("chalk-board-header");
const chalkBoardCall = document.getElementById("chalk-board-call");
const tvScreen = document.getElementById("tv-screen");
const kottansLogo = document.querySelector(".chalk-brd__kottans-logo");
const goBackBtn = document.getElementById("go-back-btn");
const randomDrinkBtn = document.getElementById("random-drink-btn");

const state = {
  loadedDrinks: null,
  nowOnTv: null,
  cacheImages: {},
};

const getData = async function (value) {
  try {
    let url = "";
    if (value === undefined) {
      url = "https://www.thecocktaildb.com/api/json/v1/1/random.php";
    } else {
      url = `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${value}`;
      if (value === "" || !value.trim().length) {
        state.loadedDrinks = null;
        return;
      }
    }

    const request = await fetch(url);
    const data = await request.json();
    state.loadedDrinks = data.drinks;
  } catch (err) {
    alert(err);
  }
};

const saveImagesToCache = function (arr) {
  if (arr === null) return;
  for (let i = 0; i < arr.length && i < 5; i++) {
    const img = new Image();
    const newElem = arr[i].strDrinkThumb;
    state.cacheImages[newElem] = img;
    img.src = arr[i].strDrinkThumb + "/preview";
  }
};

const renderChalkBoard = function (data) {
  console.log("from render " + state.loadedDrinks);
  if (data === null) {
    chalkBoardCall.classList.remove("removed");
    chalkBoardList.innerHTML = "";
    return;
  }
  const newData = data.slice(0, 5);
  chalkBoardList.innerHTML = "";
  const fragment = document.createDocumentFragment();
  newData.forEach(({ strDrink, idDrink }, index) => {
    const newLi = document.createElement("li");
    newLi.classList.add("chalk-brd__item");
    newLi.textContent =
      strDrink.length < 20 ? strDrink : strDrink.slice(0, 20) + "...";
    newLi.setAttribute("data-id", idDrink);
    if ((index == 4) & (data.length > 5))
      newLi.innerHTML += ` ( + ${data.length - 5} )`;
    fragment.append(newLi);
  });
  chalkBoardCall.classList.add("removed");
  chalkBoardList.append(fragment);
};

const requestCocktail = debounce(async function ({ target: { value } }) {
  await getData(value);
  saveImagesToCache(state.loadedDrinks);
  renderChalkBoard(state.loadedDrinks);
}, DEBOUNCE_TIME);

const requestRandomCocktail = async function () {
  await getData();
  saveImagesToCache(state.loadedDrinks);
  [state.currentDrink] = state.loadedDrinks;
  parseDetails();
  slideDetailsFrame();

  chalkBoardCall.classList.remove("removed");
  chalkBoardList.innerHTML = "";
  cocktailInput.value = "";
};

const showDrinkImage = function ({ target }) {
  const li = target.closest("li");
  if (!li) return;
  if (state.loadedDrinks === null || state.nowOnTv === li.dataset.id) return;
  const drink = state.loadedDrinks.find(
    (elem) => elem.idDrink === li.dataset.id
  );
  state.nowOnTv = drink.idDrink;
  state.currentDrink = drink;
  tvScreen.src = `${drink.strDrinkThumb}/preview`;
};

const hideDrinkImage = function ({ target }) {
  if (state.nowOnTv === null) return;
  tvScreen.src = "./img/interference.gif";
  state.nowOnTv = null;
};

const slideDetailsFrame = function (e) {
  secondFrame.classList.toggle("drink-descript--open");
};

const parseDetails = function () {
  secondFrameWrapper.innerHTML = "";
  const ingredList = [];
  const ingredMeasures = [];
  for (let i = 1; i <= 15; i++) {
    const ingrNo = `strIngredient${i}`;
    const measureNo = `strMeasure${i}`;
    if (state.currentDrink[ingrNo]) {
      ingredList.push(state.currentDrink[ingrNo]);
      ingredMeasures.push(
        state.currentDrink[measureNo] ? state.currentDrink[measureNo] : "by eye"
      );
    }
  }
  let template = `
  <h1 class="drink-descript__header">${state.currentDrink.strDrink}</h1>
  <img
    class="drink-descript__img"
    src="${state.currentDrink.strDrinkThumb}/preview"
    alt="drink-img"
  />
  <div class="ingredients">
  <ul class="ingredients__list-name">
    ${ingredList
      .map((elem) => `<li class="ingredients__item">${elem}</li>`)
      .join("")}
    
  </ul>
  <ul class="ingredients__list-qty">
    ${ingredMeasures
      .map((elem) => `<li class="ingredients__item">${elem}</li>`)
      .join("")}
  </ul>
  
</div>
<p class="drink-descript__receipt">${state.currentDrink.strInstructions}</p>
  `;
  secondFrameWrapper.innerHTML = template;
};

//-----------------------------------------------

const showDrinkDetails = function (event) {
  event.preventDefault();
  slideDetailsFrame();
  parseDetails();
};

window.addEventListener("DOMContentLoaded", () => {
  cocktailInput.addEventListener("input", requestCocktail);
  chalkBoardList.addEventListener("mouseover", showDrinkImage);
  chalkBoardList.addEventListener("mouseleave", hideDrinkImage);
  chalkBoardList.addEventListener("click", showDrinkDetails);
  goBackBtn.addEventListener("click", slideDetailsFrame);
  randomDrinkBtn.addEventListener("click", requestRandomCocktail);

  //MOBILE SCREEN & KEYBOARD HACKFIX
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  ) {
    cocktailInput.addEventListener("focus", () =>
      [
        chalkBoardList,
        chalkBoardHeader,
        chalkBoardCall,
        kottansLogo,
      ].forEach((e) => e.classList.add("hidden"))
    );
    cocktailInput.addEventListener("blur", () =>
      [
        chalkBoardList,
        chalkBoardHeader,
        chalkBoardCall,
        kottansLogo,
      ].forEach((e) => e.classList.remove("hidden"))
    );
    cocktailInput.addEventListener("change", (e) => e.target.blur());
  }
});
