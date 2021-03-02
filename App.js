import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ToastAndroid,
  LogBox,
} from "react-native";
import * as firebase from "firebase"; //firebase modulu
import "firebase/firestore"; //database için firestore
import Swiper from "react-native-deck-swiper";
import { Transitioning, Transition } from "react-native-reanimated"; //animasyon işlemleri
import { MaterialCommunityIcons } from "@expo/vector-icons"; //iconlar
const { width } = Dimensions.get("window"); //cihaz genişliği
const stackSize = 4; //Art arda image sayısı
LogBox.ignoreLogs(["Setting a timer"]);

const colors = {
  red: "#EC2379",
  blue: "#0070FF",
  gray: "#777777",
  white: "#ffffff",
  black: "#000000",
};

const ANIMATION_DURATION = 200;

const transition = (
  <Transition.Sequence>
    <Transition.Out
      type="slide-bottom"
      durationMs={ANIMATION_DURATION}
      interpolation="easeIn"
    />
    <Transition.Together>
      <Transition.In
        type="fade"
        durationMs={ANIMATION_DURATION}
        delayMs={ANIMATION_DURATION / 2}
      />
      <Transition.In
        type="slide-bottom"
        durationMs={ANIMATION_DURATION}
        delayMs={ANIMATION_DURATION / 2}
        interpolation="easeOut"
      />
    </Transition.Together>
  </Transition.Sequence>
);

const swiperRef = React.createRef(); //react-native-deck-swiper current index alma işlemleri için
const transitionRef = React.createRef();

export default function App() {
  const [index, setIndex] = React.useState(0);
  const [photos, setphotos] = useState([]);
  const [Loading, setLoading] = useState(true); //resimlerin yüklemesinin başlaması/tamamlanması

  //resimlerin sadece storage'den çekileceği zaman kullanılabilecek function-
  // const getImages = async () => {
  //   const imageRefs = await firebase.storage().ref().child("images/").listAll();
  //   const urls = await Promise.all(
  //     imageRefs.items.map((ref) => ref.getDownloadUrl())
  //   );
  //   setimage(urls);
  // };

  //Bir fotoğraf swipe olduğunda şimdiki index'e 1 eklenir-geçiş işlemleri
  const onSwiped = () => {
    transitionRef.current.animateNextTransition();
    setIndex((index + 1) % photos.length);
  };
  //Firebase kurulumu - uygulama başlatıldığında 1 defa çalışır
  useEffect(() => {
    var firebaseConfig = {
      apiKey: "***",
      authDomain: "***",
      projectId: "***",
      storageBucket: "***",
      messagingSenderId: "***",
      appId: "***",
      measurementId: "***",
    };
    // Initialize Firebase
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    } else {
      firebase.app(); // if already initialized, use that one
    }
  }, []);

  //resimler cloud firestore eş zamanlı olarak getiriliyor herhangi bir değişiklik anında yansıyacak
  useEffect(() => {
    const subscriber = firebase
      .firestore()
      .collection("photos")
      .orderBy("location", "asc") //fotoğraf konumları-> artan sıra
      .onSnapshot((querySnapshot) => {
        const photos_array = [];

        querySnapshot.forEach((documentSnapshot) => {
          photos_array.push({
            ...documentSnapshot.data(),
            key: documentSnapshot.id,
          });
        });

        setphotos(photos_array);
        setLoading(false);
        // console.log(photos_array);
      });

    // Unsubscribe from events when no longer in use
    return () => subscriber();
  }, []);

  const Card = ({ card }) => {
    return (
      <View style={styles.card}>
        <Image source={{ uri: card.image }} style={styles.cardImage} />
      </View>
    );
  };

  const CardDetails = ({ index }) =>
    !Loading ? (
      <View key={index} style={{ alignItems: "center" }}>
        <Text style={[styles.text, styles.heading]} numberOfLines={2}>
          {photos[index]?.name}
        </Text>
        <Text style={[styles.text, styles.price]}>{photos[index].price}$</Text>
      </View>
    ) : (
      <ActivityIndicator size="large" color="#f7aa1a" />
    );

  //swipe right action(fotoğrafın beğenilmesi) firestore'daki database'te 'location' alanı 'liked' olarak güncellenir
  const LikePhoto = (index) => {
    firebase
      .firestore()
      .collection("photos")
      .doc(photos[index].key)
      .update({
        state: "Liked",
      })
      .then(() => {
        // console.log("photos liked!");
        ToastAndroid.show(`${photos[index].name} Liked`, ToastAndroid.SHORT);
      });
  };

  //swipe left action(fotoğrafın beğenilmemesi) firestore'daki database'te 'location' alanı 'dislike' olarak güncellenir
  const DisikePhoto = (index) => {
    firebase
      .firestore()
      .collection("photos")
      .doc(photos[index].key)
      .update({
        state: "Disliked",
      })
      .then(() => {
        // console.log("photos Disliked!");
        ToastAndroid.show(`${photos[index].name} Dislike`, ToastAndroid.SHORT);
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <MaterialCommunityIcons
        name="crop-square"
        size={width}
        color={colors.blue}
        style={{
          opacity: 0.05,
          transform: [{ rotate: "45deg" }, { scale: 1.6 }],
          position: "absolute",
          left: -15,
          top: 30,
        }}
      />
      <StatusBar hidden={true} />
      <View style={styles.swiperContainer}>
        {!Loading ? (
          <Swiper
            ref={swiperRef}
            cards={photos}
            cardIndex={index}
            renderCard={(card) => <Card card={card} />}
            infinite
            backgroundColor={"transparent"}
            onSwiped={onSwiped}
            onTapCard={() => swiperRef.current.swipeLeft()}
            cardVerticalMargin={50}
            stackSize={stackSize}
            stackScale={10}
            onSwipedRight={LikePhoto}
            onSwipedLeft={DisikePhoto}
            stackSeparation={14}
            animateOverlayLabelsOpacity
            animateCardOpacity
            disableTopSwipe
            disableBottomSwipe
            overlayLabels={{
              left: {
                title: "NOPE",
                style: {
                  label: {
                    backgroundColor: colors.red,
                    borderColor: colors.red,
                    color: colors.white,
                    borderWidth: 1,
                    fontSize: 24,
                  },
                  wrapper: {
                    flexDirection: "column",
                    alignItems: "flex-end",
                    justifyContent: "flex-start",
                    marginTop: 20,
                    marginLeft: -20,
                  },
                },
              },
              right: {
                title: "LIKE",
                style: {
                  label: {
                    backgroundColor: colors.blue,
                    borderColor: colors.blue,
                    color: colors.white,
                    borderWidth: 1,
                    fontSize: 24,
                  },
                  wrapper: {
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    marginTop: 20,
                    marginLeft: 20,
                  },
                },
              },
            }}
          />
        ) : (
          <ActivityIndicator size="large" color="#f7aa1a" />
        )}
      </View>

      <View style={styles.bottomContainer}>
        <Transitioning.View
          ref={transitionRef}
          transition={transition}
          style={styles.bottomContainerMeta}
        >
          <CardDetails index={index} />
        </Transitioning.View>
        <View style={styles.bottomContainerButtons}>
          <MaterialCommunityIcons.Button
            name="close"
            size={94}
            backgroundColor="transparent"
            underlayColor="transparent"
            activeOpacity={0.3}
            color={colors.red}
            onPress={() => swiperRef.current.swipeLeft()}
          />
          <MaterialCommunityIcons.Button
            name="circle-outline"
            size={94}
            backgroundColor="transparent"
            underlayColor="transparent"
            activeOpacity={0.3}
            color={colors.blue}
            onPress={() => swiperRef.current.swipeRight()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  swiperContainer: {
    flex: 0.55,
  },
  bottomContainer: {
    flex: 0.45,
    justifyContent: "space-evenly",
  },
  bottomContainerMeta: { alignContent: "flex-end", alignItems: "center" },
  bottomContainerButtons: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  cardImage: {
    width: "100%",
    flex: 1,
    resizeMode: "cover",
    borderRadius: 10,
  },
  card: {
    flex: 0.45,
    borderRadius: 8,
    shadowRadius: 25,
    shadowColor: colors.black,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 0 },
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  text: {
    textAlign: "center",
    fontSize: 50,
    backgroundColor: "transparent",
  },
  done: {
    textAlign: "center",
    fontSize: 30,
    color: colors.white,
    backgroundColor: "transparent",
  },
  heading: { fontSize: 24, marginBottom: 10, color: colors.gray },
  price: { color: colors.blue, fontSize: 32, fontWeight: "500" },
});
