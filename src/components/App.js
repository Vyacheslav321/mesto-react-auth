import React, { useState, useEffect } from "react";
import Header from "./Header";
import Main from "./Main";
import Login from "./Login";
import Register from "./Register";
import InfoTooltip from "./InfoTooltip";
import Footer from "./Footer";
import AddPlacePopup from "./AddPlacePopup";
import EditAvatarPopup from "./EditAvatarPopup";
import EditProfilePopup from "./EditProfilePopup";
import ImagePopup from "./ImagePopup";
import ProtectedRoute from "./ProtectedRoute";
import api from "../utils/Api";
import { register, authorize, getToken } from "../utils/Auth";
import { CurrentUserContext } from "../contexts/CurrentUserContext";
import {
  Route,
  Switch,
  Redirect,
  HashRouter,
  useHistory
} from "react-router-dom";
// import PageNotFound from "./PageNotFound";

const App = () => {
  const [isEditAvatarPopupOpen, setIsEditAvatarPopupOpen] = useState(false);
  const [isEditProfilePopupOpen, setIsEditProfilePopupOpen] = useState(false);
  const [isAddPlacePopupOpen, setIsAddPlacePopupOpen] = useState(false);
  const [isImagePopupOpen, setisImagePopupOpen] = useState(false);
  const [infoPopupOpen, setInfoPopupOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    name: " ",
    about: " ",
    avatar: " ",
  });
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState({});
  // const [isLoading, setIsLoading] = React.useState(false);
  const [isReg, setIsReg] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState('');
  const history = useHistory();

  const onRegister = ({ email, password }) => {
    return register(email, password)
      .then((data) => {
        setIsReg(true);
        setInfoPopupOpen(true);
        setEmail(data.email);
        history.push("/sign-in");
      })
      .catch((err) => {
        setMessage(err.message);
        setIsReg(false);
        setInfoPopupOpen(true);
      });
  };

  const onLogin = ({ email, password }) => {
    return authorize(email, password).then((res) => {
      if (res) {
        localStorage.setItem("token", res.token);
        setLoggedIn(true);
      }
    });
  };

  // проверка валидности токена и получения email
  useEffect(() => {
    if (loggedIn) {
      const token = localStorage.getItem("token");
      if (token) {
        getToken(token).then((res) => {
          if (res) {
            setEmail(res.data.email);
            setLoggedIn(true);
          }
        });
      }
    }
  }, [loggedIn]);

  useEffect(() => {
    Promise.all([api.getUserInfo(), api.getCards()])
      .then(([userInfo, cardData]) => {
        // cardData.reverse();
        setCurrentUser(userInfo);
        setCards(cardData);
      })
      .catch((err) => {
        console.log(`Ошибка загрузки данных ${err}`);
      });
  }, [loggedIn]);

  function handleEditAvatarClick() {
    setIsEditAvatarPopupOpen(true);
  }

  function handleEditProfileClick() {
    setIsEditProfilePopupOpen(true);
  }

  function handleAddPlaceClick() {
    setIsAddPlacePopupOpen(true);
  }

  function handleCardClick(card) {
    setSelectedCard(card);
    setisImagePopupOpen(true);
  }

  function handleCardLike(card) {
    // Снова проверяем, есть ли уже лайк на этой карточке
    const isLiked = card.likes.some((i) => i._id === currentUser._id);
    // Отправляем запрос в API и получаем обновлённые данные карточки
    api
      .changeLikeCardStatus(card._id, !isLiked)
      .then((newCard) => {
        // Обновляем стейт
        // Формируем новый массив на основе имеющегося, подставляя в него новую карточку
        setCards((state) =>
          state.map((c) => (c._id === card._id ? newCard : c))
        );
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function handleCardDelete(card) {
    api
      .deleteUserCard(card._id)
      .then(() => {
        // Обновляем стейт
        // копиюя массива за исключением удалённой карточки
        setCards((state) => state.filter((c) => c._id !== card._id));
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function handleUpdateUser(user) {
    api
      .setUserInfo(user.name, user.about)
      .then((userData) => {
        setCurrentUser({
          ...currentUser,
          name: userData.name,
          about: userData.about,
        });
        closeAllPopups();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function handleUpdateAvatar(user) {
    api
      .setAvatar(user.avatar)
      .then((userData) => {
        setCurrentUser({
          ...currentUser,
          avatar: userData.avatar,
        });
        closeAllPopups();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function handleAddPlaceSubmit(card) {
    api
      .createUserCard(card)
      .then((newCard) => {
        setCards([newCard, ...cards]);
        closeAllPopups();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  useEffect(() => {
    function handleEscClose(evt) {
      if (evt.keyCode === 27) {
        closeAllPopups();
      }
    }
    if (
      isEditAvatarPopupOpen ||
      isEditProfilePopupOpen ||
      isAddPlacePopupOpen ||
      isImagePopupOpen ||
      infoPopupOpen
    ) {
      window.addEventListener("keydown", handleEscClose);
    }
    return () => {
      window.removeEventListener("keydown", handleEscClose);
    };
  }, [
    isEditAvatarPopupOpen,
    isEditProfilePopupOpen,
    isAddPlacePopupOpen,
    isImagePopupOpen,
    infoPopupOpen,
  ]);

  function closeAllPopups() {
    setIsEditAvatarPopupOpen(false);
    setIsEditProfilePopupOpen(false);
    setIsAddPlacePopupOpen(false);
    setisImagePopupOpen(false);
    setSelectedCard({});
    setInfoPopupOpen(false);
  }

  useEffect(() => {
    if (loggedIn) {
      history.push('/');
    } else {
      history.push('/sign-in');
    }
  }, [loggedIn]);

  const handleExit = () => {
    localStorage.removeItem("token");
    setLoggedIn(false);
  };

  return (
    <div className="page">
      <CurrentUserContext.Provider value={currentUser}>
        <HashRouter>
          <Header eemail={email} onExit={handleExit} />
          <Switch>
            <ProtectedRoute
              exact
              path="/"
              loggedIn={loggedIn}
              component={Main}
              onEditAvatar={handleEditAvatarClick}
              onEditProfile={handleEditProfileClick}
              onAddPlace={handleAddPlaceClick}
              onCardClick={handleCardClick}
              onCardLike={handleCardLike}
              onCardDelete={handleCardDelete}
              cards={cards}
            />
            {/* роут для регистрации */}
            <Route path="/sign-up">
              <Register onRegister={onRegister} />
            </Route>
            {/* роут для авторизации */}
            <Route path="/sign-in">
              <Login onLogin={onLogin} />
            </Route>
            <Route exact path="/">
              {loggedIn ? <Redirect to="/" /> : <Redirect to="/sign-up" />}
            </Route>
            {/* сделать на рефакторинг
          <Route path='*'>
            <PageNotFound />
          </Route> */}
          </Switch>
          <Route exact path="/">
            <Footer />
          </Route>
        </HashRouter>

        <InfoTooltip
          isOpen={infoPopupOpen}
          onClose={closeAllPopups}
          isReg={isReg}
          okText="Вы успешно зарегистрировались!"
          errText="Что-то пошло не так! Попробуйте ещё раз."
          message={message}
        />
        <EditAvatarPopup
          isOpen={isEditAvatarPopupOpen}
          onClose={closeAllPopups}
          onUpdateAvatar={handleUpdateAvatar}
        />
        <EditProfilePopup
          isOpen={isEditProfilePopupOpen}
          onClose={closeAllPopups}
          onUpdateUser={handleUpdateUser}
        />
        <AddPlacePopup
          isOpen={isAddPlacePopupOpen}
          onClose={closeAllPopups}
          onAddPlace={handleAddPlaceSubmit}
        />
        <ImagePopup card={selectedCard} onClose={closeAllPopups} />
      </CurrentUserContext.Provider>
    </div>
  );
};

export default App;
