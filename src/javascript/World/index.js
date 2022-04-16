import * as THREE from 'three'
import Materials from './Materials.js'
import Floor from './Floor.js'
import Shadows from './Shadows.js'
import Physics from './Physics.js'
import Zones from './Zones.js'
import Objects from './Objects.js'
import Car from './Car.js'
import Areas from './Areas.js'
import Tiles from './Tiles.js'
import Walls from './Walls.js'
import IntroSection from './Sections/IntroSection.js'
import ProjectsSection from './Sections/ProjectsSection.js'
import CrossroadsSection from './Sections/CrossroadsSection.js'
import InformationSection from './Sections/InformationSection.js'
import PlaygroundSection from './Sections/PlaygroundSection.js'
// import DistinctionASection from './Sections/DistinctionASection.js'
// import DistinctionBSection from './Sections/DistinctionBSection.js'
// import DistinctionCSection from './Sections/DistinctionCSection.js'
// import DistinctionDSection from './Sections/DistinctionDSection.js'
import Controls from './Controls.js'
import Sounds from './Sounds.js'
import { TweenLite } from 'gsap/TweenLite'
import { Power2 } from 'gsap/EasePack'
import EasterEggs from './EasterEggs.js'

export default class
{
    constructor(_options)
    {
        // Options
        this.config = _options.config
        this.debug = _options.debug
        this.resources = _options.resources
        this.time = _options.time
        this.sizes = _options.sizes
        this.camera = _options.camera
        this.renderer = _options.renderer
        this.passes = _options.passes

        // Debug
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder('world')
            this.debugFolder.open()
        }

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false

        // this.setAxes()
        this.setSounds()
        this.setControls()
        this.setFloor()
        this.setAreas()
        this.setStartingScreen()
    }

    start()
    {
        window.setTimeout(() =>
        {
            this.camera.pan.enable()
        }, 2000)

        this.setReveal()
        this.setMaterials()
        this.setShadows()
        this.setPhysics()
        this.setZones()
        this.setObjects()
        this.setCar()
        this.areas.car = this.car
        this.setTiles()
        this.setWalls()
        this.setSections()
        this.setEasterEggs()
    }

    setReveal()
    {
        this.reveal = {}
        this.reveal.matcapsProgress = 0
        this.reveal.floorShadowsProgress = 0
        this.reveal.previousMatcapsProgress = null
        this.reveal.previousFloorShadowsProgress = null

        // Go method
        this.reveal.go = () =>
        {
            TweenLite.fromTo(this.reveal, 3, { matcapsProgress: 0 }, { matcapsProgress: 1 })
            TweenLite.fromTo(this.reveal, 3, { floorShadowsProgress: 0 }, { floorShadowsProgress: 1, delay: 0.5 })
            TweenLite.fromTo(this.shadows, 3, { alpha: 0 }, { alpha: 0.5, delay: 0.5 })

            if(this.sections.intro)
            {
                TweenLite.fromTo(this.sections.intro.instructions.arrows.label.material, 0.3, { opacity: 0 }, { opacity: 1, delay: 0.5 })
                if(this.sections.intro.otherInstructions)
                {
                    TweenLite.fromTo(this.sections.intro.otherInstructions.label.material, 0.3, { opacity: 0 }, { opacity: 1, delay: 0.75 })
                }
            }

            // Car
            this.physics.car.chassis.body.sleep()
            this.physics.car.chassis.body.position.set(0, 0, 12)

            window.setTimeout(() =>
            {
                this.physics.car.chassis.body.wakeUp()
            }, 300)

            // Sound
            TweenLite.fromTo(this.sounds.engine.volume, 0.5, { master: 0 }, { master: 0.7, delay: 0.3, ease: Power2.easeIn })
            window.setTimeout(() =>
            {
                this.sounds.play('reveal')
            }, 400)

            // Controls
            if(this.controls.touch)
            {
                window.setTimeout(() =>
                {
                    this.controls.touch.reveal()
                }, 400)
            }
        }

        // Time tick
        this.time.on('tick',() =>
        {
            // Matcap progress changed
            if(this.reveal.matcapsProgress !== this.reveal.previousMatcapsProgress)
            {
                // Update each material
                for(const _materialKey in this.materials.shades.items)
                {
                    const material = this.materials.shades.items[_materialKey]
                    material.uniforms.uRevealProgress.value = this.reveal.matcapsProgress
                }

                // Save
                this.reveal.previousMatcapsProgress = this.reveal.matcapsProgress
            }

            // Matcap progress changed
            if(this.reveal.floorShadowsProgress !== this.reveal.previousFloorShadowsProgress)
            {
                // Update each floor shadow
                for(const _mesh of this.objects.floorShadows)
                {
                    _mesh.material.uniforms.uAlpha.value = this.reveal.floorShadowsProgress
                }

                // Save
                this.reveal.previousFloorShadowsProgress = this.reveal.floorShadowsProgress
            }
        })

        // Debug
        if(this.debug)
        {
            this.debugFolder.add(this.reveal, 'matcapsProgress').step(0.0001).min(0).max(1).name('matcapsProgress')
            this.debugFolder.add(this.reveal, 'floorShadowsProgress').step(0.0001).min(0).max(1).name('floorShadowsProgress')
            this.debugFolder.add(this.reveal, 'go').name('reveal')
        }
    }

    setStartingScreen()
    {
        this.startingScreen = {}

        // Area
        this.startingScreen.area = this.areas.add({
            position: new THREE.Vector2(0, 0),
            halfExtents: new THREE.Vector2(2.35, 1.5),
            hasKey: false,
            testCar: false,
            active: false
        })

        // Loading label
        this.startingScreen.loadingLabel = {}
        this.startingScreen.loadingLabel.geometry = new THREE.PlaneBufferGeometry(4.5, 4.5 / 4)
        this.startingScreen.loadingLabel.image = new Image()
        this.startingScreen.loadingLabel.image.src = 'data:image/png;base64,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'
        // this.startingScreen.loadingLabel.image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAABABAMAAAAHc7SNAAAAMFBMVEUAAAD///9ra2ucnJzR0dH09PQmJiaNjY24uLjp6end3d1CQkLFxcVYWFiqqqp9fX3nQ5qrAAAEVUlEQVRo3u3YT08TQRQA8JEtW6CATGnDdvljaTwYE2IBI/HGRrwSetGTsZh4MPFQYiQe229gE++WePFY9Oqh1cRzieEDYIgXLxjPJu5M33vbZQszW+fgoS+B7ewO836znRl2lg1jGMP4P2Okw0yFvaKsklr3I99Tvl3iPPelGbQhKqxB4eN6N/7gVcsvbEAz1F4RLn67zzl/v6/oLvejGBQ9LsNphio4UFjmEAsVJuOK/zkDtc6w+gyTcZ3LyP6IAzjBDA+pj6LkEgAjW4kANsMAC6vmOvqAMU5RgVOTskQACicCmCcA9AXjkT5gj1MswqlxWcoTgKJ6HuAQAD5guNoAu8QpMnBul1ONMGD2PCBbRgDAKYq6AEtmXvtdj3S6GhRyW1t1DvkAgM0ggG7mu1t3xWFHFzAqv3wYCi0mY1UCGgiQPU+1oWIY8LoXcAA3qeYfr+kClvHW14PJ5OfCAgHYNAoDAORBQIrDvHjqH5c0ANTbORzBacbAQgUC2IAKAzI9gCSHlWEMLmgBPJxMvyARpIICALDm4nkAbwIA71EZx5UOgO48JnLoOhQIAN9sOgKoBoAE5r0aB8ARcNhtFzrg0VQmwCp8CAMeAADGc44S5GMBsF1aCEU2LcAcAPDCvwFytBDehCaUgJxRAKeF8BNUUQJ43iiAUlqwFKoBrTCAHjiagwEgU0YM5IYWYD4KoIgPwIXQwUbVgCXzgLpIBJNeDciWTQNskVsq1ADX/6kYBdCTjse5owbMiX+IpgGWOCPSuWpA2vN/TAMm5QTYg5IC4FdbMA0YF5Nb5s2rAaLyhzBgektGZWDArrgqi0U1QHxf38OABDwUDgTAjGfyPlTVgJT/67FBACbqyGYaaoBctQwD2vI4DecVAPkgZRhQlxPQks2rAePGAbZsRlaa1QBYEQBUHRCAmaXD0QDYxgFWdye05R9cDQCrmQYkeBA6gGXTgNEeQF4DMG4S4MLjOUZRA5A0CcjADgmjqgGwSwSg9wK1GIBS74KTgTxv/EHoiaVQsTOS5RoCJuiZyosB8EIrHpyowFiYofO0i4wCjhCQwL0hq2sCaFNM22S4JXloLk0AuLDTBzCBAAt3xykeA7CHe/mDbgdTvQ9GswSAwdbqA0giYASHjQUJnhQKhQ6z/d8rDA4hAG2Dsk042ejubHMM2nV6AMf93pCkaRjhh0WsWuz+6aasl2FwiAImReEts1/CSaFfwFouAJxC4RW+I4oCThBQE1X2WbKkBFDkqYDtJ0SHaYKq3pJJwCECjjiFPoC1w+2P0gumurgeBjT6AhIIGKOelGIAngWlFnRnMZjMIYBb7gtIIsAuYU+8GICpEhYyZVgIZ2g9rYYAX1lfAKvjnxzjnWrHALDn9K1h2k2aoI1ewGd2AWAVAVMHcKdW4wDYje739pNufJXhkJohgLu9zy4CHCKAJYUge4ddCojGyPrp9kaHmYjUi9N7+2wYwxjGZfEXMKxGE0GkkfIAAAAASUVORK5CYII='
        this.startingScreen.loadingLabel.texture = new THREE.Texture(this.startingScreen.loadingLabel.image)
        this.startingScreen.loadingLabel.texture.magFilter = THREE.NearestFilter
        this.startingScreen.loadingLabel.texture.minFilter = THREE.LinearFilter
        this.startingScreen.loadingLabel.texture.needsUpdate = true
        this.startingScreen.loadingLabel.material = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, color: 0xffffff, alphaMap: this.startingScreen.loadingLabel.texture })
        this.startingScreen.loadingLabel.mesh = new THREE.Mesh(this.startingScreen.loadingLabel.geometry, this.startingScreen.loadingLabel.material)
        this.startingScreen.loadingLabel.mesh.matrixAutoUpdate = false
        this.container.add(this.startingScreen.loadingLabel.mesh)

        // Start label
        this.startingScreen.startLabel = {}
        this.startingScreen.startLabel.geometry = new THREE.PlaneBufferGeometry(4.5, 4.5 / 4)
        // this.startingScreen.startLabel.geometry = new THREE.PlaneBufferGeometry(2.5, 2.5 / 4)
        this.startingScreen.startLabel.image = new Image()
        this.startingScreen.startLabel.image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAABABAMAAAAHc7SNAAAAMFBMVEUAAAD///+cnJxra2vR0dHd3d0mJib09PRYWFjp6em4uLhCQkKqqqqNjY19fX3FxcV3XeRgAAADsklEQVRo3u3YsU9TQRwH8KNgLSDQg9ZCAak1IdE4PKPu1NTEsSzOMDl3I3GpcXAxBhLjXFxNjJgQJ2ON0Rnj4uAAEyv8B/L7tV++5/VN+CM69Ldwfa+534d7d793VzeIQQzi/49c4v5lPF/1vvhFm++rjIpcyErrmrSCuz+cxng1iL/If8drPJD2Lc/Iy4VhaZWlFd4tLPfuMc6e/5LvRilJA2SkVSQA8c0OsI0uNtIAU9rsB8y1rAAZjyimAUa1mQDAeGwF+MA+9lIA69qs9AMKVoDP8vhf35A+NiMAc7YJKFSrX7tcI8BW9+k/O/kz6zSunjSnncMHiQYBcmdXrh3xCVbc2WO8N/YZZI0AxxwMArKivmwAwFKSPmV0UwBbCpj5E+C+yzUbQAaJVwUSA9SFjwFgHQ0jAMrBWgzAPCtHgFFbQAlpEwKC2zWUQgJGbAH+naSdu/fTxQAthPL5/ADD6OCpQwCAsb6LsbEGcBluOAYBmG2fkMIawHVWXEsDIGUGpZCAIRsAS93DPgDbhUmUQgKe2NUB90hfhK0YwEJYHkYpJGDbqBKiB86CGLAlzd6/S8CEvh8sACiBvrSXCshKblWEgNy2vkAMAHwGfjECcJHOu5qUQgDm6vXulshZAXJNL9GJAeg+LxeKPQBj1gzgdlnuCWAhbOi7LwaU9u0A2VWPpUgAC+GR5k0iwBtnB3Bj3qMaRYB17X0IOQhYcjYA7guxxyIAGfd1HNqchPfly7aACQUshAA2W1r5G1yG415YpgB3qIIkAHBH2D075QnQ10fHDsCl+CoGSKpiN8kMAVqIN00BsitnVgKyPIBMB4ADKU92AA5BKQIgszjKBGBLagpwB5xZBGS6pbcuizQAXMA6NAK86OCQ3okAI55BQPe7VoDxXzU/iwPASgS4GAASAiYxWgYAzvAa1loA2AkAFQIU2zEELCJtDDgIAG0CFLvp7LblC2kAtF6eTEJJ2CBAr88bAXKY4WkASbzXmwt5AvTvohHA4WSUBmj2Jt+IThQChrAOLQC13vPFMAOAQwuyTAeAKVQto3OBDOdESh2YxNZPbpYBQNbEAoBfod7e1i1BiwB0voSZWgwAOWgtAGPhD18E8ASIiRIAXNPwXJBtcqMbAFAIr5weIJMAcIx1aAAIqk0lAuycompyFwBMHAsAZlj/lgw0rsy2AkhbsgK4Q+70CUBjxeFXsUb0G1HJDJC9rketZRcCWCJwHM8DgJm7b7ch+XizXm25QQxiEOcXvwGCWOhbCZC0qAAAAABJRU5ErkJggg=='
        // this.startingScreen.startLabel.image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAABABAMAAAAHc7SNAAAAMFBMVEUAAAD///+cnJxra2vR0dHd3d0mJib09PRYWFjp6em4uLhCQkKqqqqNjY19fX3FxcV3XeRgAAADsklEQVRo3u3YsU9TQRwH8KNgLSDQg9ZCAak1IdE4PKPu1NTEsSzOMDl3I3GpcXAxBhLjXFxNjJgQJ2ON0Rnj4uAAEyv8B/L7tV++5/VN+CM69Ldwfa+534d7d793VzeIQQzi/49c4v5lPF/1vvhFm++rjIpcyErrmrSCuz+cxng1iL/If8drPJD2Lc/Iy4VhaZWlFd4tLPfuMc6e/5LvRilJA2SkVSQA8c0OsI0uNtIAU9rsB8y1rAAZjyimAUa1mQDAeGwF+MA+9lIA69qs9AMKVoDP8vhf35A+NiMAc7YJKFSrX7tcI8BW9+k/O/kz6zSunjSnncMHiQYBcmdXrh3xCVbc2WO8N/YZZI0AxxwMArKivmwAwFKSPmV0UwBbCpj5E+C+yzUbQAaJVwUSA9SFjwFgHQ0jAMrBWgzAPCtHgFFbQAlpEwKC2zWUQgJGbAH+naSdu/fTxQAthPL5/ADD6OCpQwCAsb6LsbEGcBluOAYBmG2fkMIawHVWXEsDIGUGpZCAIRsAS93DPgDbhUmUQgKe2NUB90hfhK0YwEJYHkYpJGDbqBKiB86CGLAlzd6/S8CEvh8sACiBvrSXCshKblWEgNy2vkAMAHwGfjECcJHOu5qUQgDm6vXulshZAXJNL9GJAeg+LxeKPQBj1gzgdlnuCWAhbOi7LwaU9u0A2VWPpUgAC+GR5k0iwBtnB3Bj3qMaRYB17X0IOQhYcjYA7guxxyIAGfd1HNqchPfly7aACQUshAA2W1r5G1yG415YpgB3qIIkAHBH2D075QnQ10fHDsCl+CoGSKpiN8kMAVqIN00BsitnVgKyPIBMB4ADKU92AA5BKQIgszjKBGBLagpwB5xZBGS6pbcuizQAXMA6NAK86OCQ3okAI55BQPe7VoDxXzU/iwPASgS4GAASAiYxWgYAzvAa1loA2AkAFQIU2zEELCJtDDgIAG0CFLvp7LblC2kAtF6eTEJJ2CBAr88bAXKY4WkASbzXmwt5AvTvohHA4WSUBmj2Jt+IThQChrAOLQC13vPFMAOAQwuyTAeAKVQto3OBDOdESh2YxNZPbpYBQNbEAoBfod7e1i1BiwB0voSZWgwAOWgtAGPhD18E8ASIiRIAXNPwXJBtcqMbAFAIr5weIJMAcIx1aAAIqk0lAuycompyFwBMHAsAZlj/lgw0rsy2AkhbsgK4Q+70CUBjxeFXsUb0G1HJDJC9rketZRcCWCJwHM8DgJm7b7ch+XizXm25QQxiEOcXvwGCWOhbCZC0qAAAAABJRU5ErkJggg=='
        this.startingScreen.startLabel.texture = new THREE.Texture(this.startingScreen.startLabel.image)
        this.startingScreen.startLabel.texture.magFilter = THREE.NearestFilter
        this.startingScreen.startLabel.texture.minFilter = THREE.LinearFilter
        this.startingScreen.startLabel.texture.needsUpdate = true
        this.startingScreen.startLabel.material = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, color: 0xffffff, alphaMap: this.startingScreen.startLabel.texture })
        this.startingScreen.startLabel.material.opacity = 0
        this.startingScreen.startLabel.mesh = new THREE.Mesh(this.startingScreen.startLabel.geometry, this.startingScreen.startLabel.material)
        this.startingScreen.startLabel.mesh.matrixAutoUpdate = false
        this.container.add(this.startingScreen.startLabel.mesh)

        // Progress
        this.resources.on('progress', (_progress) =>
        {
            // Update area
            this.startingScreen.area.floorBorder.material.uniforms.uAlpha.value = 1
            this.startingScreen.area.floorBorder.material.uniforms.uLoadProgress.value = _progress
        })

        // Ready
        this.resources.on('ready', () =>
        {
            window.requestAnimationFrame(() =>
            {
                this.startingScreen.area.activate()

                TweenLite.to(this.startingScreen.area.floorBorder.material.uniforms.uAlpha, 0.3, { value: 0.3 })
                TweenLite.to(this.startingScreen.loadingLabel.material, 0.3, { opacity: 0 })
                TweenLite.to(this.startingScreen.startLabel.material, 0.3, { opacity: 1, delay: 0.3 })
            })
        })

        // On interact, reveal
        this.startingScreen.area.on('interact', () =>
        {
            this.startingScreen.area.deactivate()
            TweenLite.to(this.startingScreen.area.floorBorder.material.uniforms.uProgress, 0.3, { value: 0, delay: 0.4 })

            TweenLite.to(this.startingScreen.startLabel.material, 0.3, { opacity: 0, delay: 0.4 })

            this.start()

            window.setTimeout(() =>
            {
                this.reveal.go()
            }, 600)
        })
    }

    setSounds()
    {
        this.sounds = new Sounds({
            debug: this.debugFolder,
            time: this.time
        })
    }

    setAxes()
    {
        this.axis = new THREE.AxesHelper()
        this.container.add(this.axis)
    }

    setControls()
    {
        this.controls = new Controls({
            config: this.config,
            sizes: this.sizes,
            time: this.time,
            camera: this.camera,
            sounds: this.sounds
        })
    }

    setMaterials()
    {
        this.materials = new Materials({
            resources: this.resources,
            debug: this.debugFolder
        })
    }

    setFloor()
    {
        this.floor = new Floor({
            debug: this.debugFolder
        })

        this.container.add(this.floor.container)
    }

    setShadows()
    {
        this.shadows = new Shadows({
            time: this.time,
            debug: this.debugFolder,
            renderer: this.renderer,
            camera: this.camera
        })
        this.container.add(this.shadows.container)
    }

    setPhysics()
    {
        this.physics = new Physics({
            config: this.config,
            debug: this.debug,
            time: this.time,
            sizes: this.sizes,
            controls: this.controls,
            sounds: this.sounds
        })

        this.container.add(this.physics.models.container)
    }

    setZones()
    {
        this.zones = new Zones({
            time: this.time,
            physics: this.physics,
            debug: this.debugFolder
        })
        this.container.add(this.zones.container)
    }

    setAreas()
    {
        this.areas = new Areas({
            config: this.config,
            resources: this.resources,
            debug: this.debug,
            renderer: this.renderer,
            camera: this.camera,
            car: this.car,
            sounds: this.sounds,
            time: this.time
        })

        this.container.add(this.areas.container)
    }

    setTiles()
    {
        this.tiles = new Tiles({
            resources: this.resources,
            objects: this.objects,
            debug: this.debug
        })
    }

    setWalls()
    {
        this.walls = new Walls({
            resources: this.resources,
            objects: this.objects
        })
    }

    setObjects()
    {
        this.objects = new Objects({
            time: this.time,
            resources: this.resources,
            materials: this.materials,
            physics: this.physics,
            shadows: this.shadows,
            sounds: this.sounds,
            debug: this.debugFolder
        })
        this.container.add(this.objects.container)

        // window.requestAnimationFrame(() =>
        // {
        //     this.objects.merge.update()
        // })
    }

    setCar()
    {
        this.car = new Car({
            time: this.time,
            resources: this.resources,
            objects: this.objects,
            physics: this.physics,
            shadows: this.shadows,
            materials: this.materials,
            controls: this.controls,
            sounds: this.sounds,
            renderer: this.renderer,
            camera: this.camera,
            debug: this.debugFolder,
            config: this.config
        })
        this.container.add(this.car.container)
    }

    setSections()
    {
        this.sections = {}

        // Generic options
        const options = {
            config: this.config,
            time: this.time,
            resources: this.resources,
            camera: this.camera,
            passes: this.passes,
            objects: this.objects,
            areas: this.areas,
            zones: this.zones,
            walls: this.walls,
            tiles: this.tiles,
            debug: this.debugFolder
        }

        // // Distinction A
        // this.sections.distinctionA = new DistinctionASection({
        //     ...options,
        //     x: 0,
        //     y: - 15
        // })
        // this.container.add(this.sections.distinctionA.container)

        // // Distinction B
        // this.sections.distinctionB = new DistinctionBSection({
        //     ...options,
        //     x: 0,
        //     y: - 15
        // })
        // this.container.add(this.sections.distinctionB.container)

        // // Distinction C
        // this.sections.distinctionC = new DistinctionCSection({
        //     ...options,
        //     x: 0,
        //     y: 0
        // })
        // this.container.add(this.sections.distinctionC.container)

        // // Distinction D
        // this.sections.distinctionD = new DistinctionDSection({
        //     ...options,
        //     x: 0,
        //     y: 0
        // })
        // this.container.add(this.sections.distinctionD.container)

        // Intro
        this.sections.intro = new IntroSection({
            ...options,
            x: 0,
            y: 0
        })
        this.container.add(this.sections.intro.container)

        // Crossroads
        this.sections.crossroads = new CrossroadsSection({
            ...options,
            x: 0,
            y: - 30
        })
        this.container.add(this.sections.crossroads.container)

        // Projects
        this.sections.projects = new ProjectsSection({
            ...options,
            x: 30,
            y: - 30
            // x: 0,
            // y: 0
        })
        this.container.add(this.sections.projects.container)

        // Information
        this.sections.information = new InformationSection({
            ...options,
            x: 1.2,
            y: - 55
            // x: 0,
            // y: - 10
        })
        this.container.add(this.sections.information.container)

        // Playground
        this.sections.playground = new PlaygroundSection({
            ...options,
            x: - 38,
            y: - 34
            // x: - 15,
            // y: - 4
        })
        this.container.add(this.sections.playground.container)
    }

    setEasterEggs()
    {
        this.easterEggs = new EasterEggs({
            resources: this.resources,
            car: this.car,
            walls: this.walls,
            objects: this.objects,
            materials: this.materials,
            areas: this.areas,
            config: this.config,
            physics: this.physics
        })
        this.container.add(this.easterEggs.container)
    }
}
