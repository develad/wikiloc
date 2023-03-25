import React, { useState, useEffect, createContext } from "react";
import { DIRECTIONS } from "../utils/constants";
import { Geosearch, LatLngLocation, Result } from "../utils/types";

type Props = {
  children: React.ReactNode; // 👈️ added type for children
};

export const UtilsContext = createContext<any>({});

const UtilsProvider: React.FunctionComponent<Props> = ({ children }) => {
  const [location, setLocation] = useState<LatLngLocation>();
  const [radius, setRadius] = useState(2000);
  const [locationError, setLocationError] = useState<string>();
  const [results, setResults] = useState<Geosearch[]>([]);
  // const [loadedEnglish, setLoadedEnglish] = useState(false);
  // const [showMapView, setShowMapView] = useState(false);
  // const [showPage, setShowPage] = useState(false);

  const direction = (location: LatLngLocation | undefined, r: Geosearch) => {
    let degrees =
      (Math.atan2(location!.lng - r.lon, location!.lat - r.lat) * 180) /
        Math.PI +
      180;

    // Split into the 8 directions
    degrees = (degrees * 8) / 360;

    // round to nearest integer.
    degrees = Math.round(degrees);

    // Ensure it's within 0-7
    degrees = (degrees + 8) % 8;
    return DIRECTIONS?.[degrees];
  };

  const getFetchURL = (location: LatLngLocation, wikiLang: string): string => {
    return `https://${wikiLang}.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${location?.lat}|${location?.lng}&gsradius=2000&gslimit=50&format=json&gsprop=type|name&inprop=url&prop=info&origin=*`;
  };

  const addDataToResult = (results: Geosearch[], y: any, wikiLang: string) => {
    return results.map((result) => {
      if (result.wikiLang === wikiLang) {
        const mainImage: string = y?.query?.pages[
          result.pageid
        ]?.thumbnail?.source?.replace("50px", "500px");
        const mainImageAlt: string =
          y?.query?.pages[result.pageid]?.pageimage?.split(".")[0];
        return {
          ...result,
          description: y?.query?.pages[result?.pageid]?.description,
          mainImage: mainImage?.includes("no_free_image_yet")
            ? undefined
            : mainImage,
          mainImageAlt,
        };
      }
      return result;
    });
  };

  // function getWikipediaResults(location: LatLngLocation, wikiLang = "he") {
  //   return fetch(getFetchURL(location, wikiLang), {})
  //     .then((y) => y?.json())
  //     .then((y: Result) => {
  //       const r = [...y.query.geosearch.map((g) => ({ ...g, wikiLang }))];
  //       r.sort((a, b) => +a.dist - +b.dist);
  //       return fetch(getWikipediaInfo(y, wikiLang))
  //         .then((y) => y.json())
  //         .then((y) => addDataToResult(r, y, wikiLang));
  //     });
  // }

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position?.coords;
        setLocation({
          lat: latitude,
          lng: longitude,
        });
      },
      (error) => {
        setLocationError("Location Error: " + error?.message);
      },
    );
  }, []);

  useEffect(() => {
    if (location && !locationError) {
      setResults([]);
      getWikipediaResults(location, setResults, radius, "he");
    }
  }, [location]);

  function getWikipediaResults(
    location: LatLngLocation,
    setResults: (reduce: (orig: Geosearch[]) => Geosearch[]) => void,
    radius: number,
    wikiLang: string,
  ) {
    fetch(getFetchURL(location, (wikiLang = "he")), {})
      .then((y) => y?.json())
      .then((y: Result) => {
        setResults((orig) => {
          const r = [
            ...orig,
            ...y.query.geosearch
              .filter(
                (g) =>
                  !orig.find(
                    (o) => o.pageid == g.pageid && o.wikiLang == wikiLang,
                  ),
              )
              .map((g) => ({ ...g, wikiLang })),
          ];
          r.sort((a, b) => +a.dist - +b.dist);
          return r;
        });
        fetch(getWikipediaInfo(y, wikiLang))
          .then((y) => y.json())
          .then((y) =>
            setResults((result) => addDataToResult(result, y, wikiLang)),
          );
      });
  }

  const getWikipediaInfo = (y: Result, wikiLang: string): string => {
    return `https://${wikiLang}.wikipedia.org/w/api.php?action=query&pageids=${y?.query?.geosearch
      ?.map((t) => t?.pageid)
      ?.join("|")}&format=json&prop=description|pageimages&origin=*`;
  };

  const getResultLink = (result: Geosearch): string => {
    return `https://${result.wikiLang}.m.wikipedia.org/w/index.php?curid=${result?.pageid}`;
  };

  const getGoogleMapLink = (result: Geosearch) => {
    return `https://maps.google.com/?q=${result?.lat},${result?.lon}`;
  };

  const value = {
    direction,
    getWikipediaResults,
    getResultLink,
    getGoogleMapLink,
    results,
    location,
    locationError,
  };

  return (
    <UtilsContext.Provider value={value}>{children}</UtilsContext.Provider>
  );
};

export default UtilsProvider;

// export const direction = (
//   location: LatLngLocation | undefined,
//   r: Geosearch,
// ) => {
//   let degrees =
//     (Math.atan2(location!.lng - r.lon, location!.lat - r.lat) * 180) / Math.PI +
//     180;

//   // Split into the 8 directions
//   degrees = (degrees * 8) / 360;

//   // round to nearest integer.
//   degrees = Math.round(degrees);

//   // Ensure it's within 0-7
//   degrees = (degrees + 8) % 8;
//   return DIRECTIONS?.[degrees];
// };

// export const getFetchURL = (
//   location: LatLngLocation,
//   wikiLang: string,
// ): string => {
//   return `https://${wikiLang}.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${location?.lat}|${location?.lng}&gsradius=2000&gslimit=50&format=json&gsprop=type|name&inprop=url&prop=info&origin=*`;
// };

// export const addDataToResult = (
//   results: Geosearch[],
//   y: any,
//   wikiLang: string,
// ) => {
//   return results.map((result) => {
//     if (result.wikiLang === wikiLang) {
//       const mainImage: string = y?.query?.pages[
//         result.pageid
//       ]?.thumbnail?.source?.replace("50px", "500px");
//       const mainImageAlt: string =
//         y?.query?.pages[result.pageid]?.pageimage?.split(".")[0];
//       return {
//         ...result,
//         description: y?.query?.pages[result?.pageid]?.description,
//         mainImage: mainImage?.includes("no_free_image_yet")
//           ? undefined
//           : mainImage,
//         mainImageAlt,
//       };
//     }
//     return result;
//   });
// };

// export function getWikipediaResults(location: LatLngLocation, wikiLang = "he") {
//   return fetch(getFetchURL(location, wikiLang), {})
//     .then((y) => y?.json())
//     .then((y: Result) => {
//       const r = [...y.query.geosearch.map((g) => ({ ...g, wikiLang }))];
//       r.sort((a, b) => +a.dist - +b.dist);
//       return fetch(getWikipediaInfo(y, wikiLang))
//         .then((y) => y.json())
//         .then((y) => addDataToResult(r, y, wikiLang));
//     });
// }

// export const getWikipediaInfo = (y: Result, wikiLang: string): string => {
//   return `https://${wikiLang}.wikipedia.org/w/api.php?action=query&pageids=${y?.query?.geosearch
//     ?.map((t) => t?.pageid)
//     ?.join("|")}&format=json&prop=description|pageimages&origin=*`;
// };

// export const getResultLink = (result: Geosearch): string => {
//   return `https://${result.wikiLang}.m.wikipedia.org/w/index.php?curid=${result?.pageid}`;
// };

// export const getGoogleMapLink = (result: Geosearch) => {
//   return `https://maps.google.com/?q=${result?.lat},${result?.lon}`;
// };
