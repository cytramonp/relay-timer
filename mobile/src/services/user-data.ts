import AsyncStorage from "@react-native-async-storage/async-storage";
import { scopedRepository } from "../core/data-repository";
export const userData = scopedRepository(AsyncStorage);
